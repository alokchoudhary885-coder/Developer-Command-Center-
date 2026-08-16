import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { BroadcastService, BroadcastActivityPayload } from './broadcast.service';
import { PRState, PRReviewStatus, IssueState } from '@prisma/client';

export class WebhookService {
  /**
   * 1. HMAC SHA-256 Signature Verification using crypto.timingSafeEqual()
   */
  static verifySignature(rawPayload: string, signatureHeader?: string): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }

    const secret = env.GITHUB_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = `sha256=${hmac.update(rawPayload).digest('hex')}`;

    const expectedBuffer = Buffer.from(calculatedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signatureHeader, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  /**
   * 2. Process GitHub Webhook Event Pipeline with Delivery-ID Deduplication and DB-First Broadcast
   */
  static async processWebhookEvent(eventType: string, payload: any, deliveryId?: string) {
    if (eventType === 'ping') {
      console.log('📌 [WebhookService] Ping event received from GitHub');
      return { success: true, message: 'Ping acknowledged' };
    }

    // 1. Delivery-ID Idempotency Guard (X-GitHub-Delivery)
    if (deliveryId) {
      const existingDelivery = await prisma.webhookDelivery.findUnique({
        where: { deliveryId },
      });

      if (existingDelivery) {
        console.log(`ℹ️ [WebhookService] Delivery ID ${deliveryId} already processed. Skipping duplicate webhook.`);
        return {
          success: true,
          message: 'Webhook delivery already processed (Idempotent replay)',
          duplicate: true,
        };
      }
    }

    let broadcastPayload: BroadcastActivityPayload | null = null;
    let resultData: any = null;

    // 2. Perform DB Updates according to Event Type
    switch (eventType) {
      case 'pull_request': {
        const res = await this.handlePullRequestEvent(payload);
        broadcastPayload = res.broadcast;
        resultData = res.pr;
        break;
      }

      case 'issues': {
        const res = await this.handleIssueEvent(payload);
        broadcastPayload = res.broadcast;
        resultData = res.issue;
        break;
      }

      case 'push': {
        const res = await this.handlePushEvent(payload);
        broadcastPayload = res.broadcast;
        resultData = { count: res.count };
        break;
      }

      default:
        console.log(`ℹ️ [WebhookService] Unhandled event type: ${eventType}`);
        return { success: true, message: `Event ${eventType} received but not tracked in telemetry` };
    }

    // 3. Record Webhook Delivery ID on successful DB commit
    if (deliveryId) {
      await prisma.webhookDelivery.create({
        data: {
          deliveryId,
          event: eventType,
          status: 'PROCESSED',
        },
      });
    }

    // 4. Guaranteed Sequence: DB Commit Succeeded -> Broadcast to Socket.IO
    if (broadcastPayload) {
      BroadcastService.emitActivity(broadcastPayload);
    }

    return {
      success: true,
      event: eventType,
      data: resultData,
    };
  }

  /**
   * Handle Pull Request Webhook Event
   */
  private static async handlePullRequestEvent(payload: any) {
    const { action, pull_request: pr, repository: repo, sender } = payload;
    if (!pr || !repo) throw new Error('Invalid PR payload structure');

    const repoGithubId = repo.id.toString();
    let dbRepo = await prisma.repository.findUnique({
      where: { githubId: repoGithubId },
    });

    if (!dbRepo) {
      dbRepo = await prisma.repository.create({
        data: {
          githubId: repoGithubId,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner?.login || sender?.login || 'unknown',
          htmlUrl: repo.html_url,
          isPrivate: repo.private || false,
        },
      });
    }

    let state: PRState = PRState.OPEN;
    if (pr.merged_at || (action === 'closed' && pr.merged)) {
      state = PRState.MERGED;
    } else if (pr.state === 'closed' || action === 'closed') {
      state = PRState.CLOSED;
    }

    let reviewStatus: PRReviewStatus = PRReviewStatus.PENDING_REVIEW;
    if (pr.draft) reviewStatus = PRReviewStatus.DRAFT;

    const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
    const closedAt = pr.closed_at ? new Date(pr.closed_at) : null;

    const updatedPR = await prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: dbRepo.id,
          number: pr.number,
        },
      },
      update: {
        title: pr.title,
        description: pr.body,
        url: pr.html_url,
        state,
        reviewStatus,
        closedAt,
        mergedAt,
      },
      create: {
        githubId: pr.id.toString(),
        number: pr.number,
        title: pr.title,
        description: pr.body,
        url: pr.html_url,
        state,
        reviewStatus,
        repositoryId: dbRepo.id,
        closedAt,
        mergedAt,
      },
    });

    let activityAction = 'PR_UPDATED';
    if (action === 'opened') activityAction = 'PR_OPENED';
    else if (state === PRState.MERGED) activityAction = 'PR_MERGED';
    else if (action === 'closed') activityAction = 'PR_CLOSED';

    const activity = await prisma.activityLog.create({
      data: {
        action: activityAction,
        entityType: 'PULL_REQUEST',
        entityId: updatedPR.id,
        repositoryId: dbRepo.id,
        metadata: {
          number: pr.number,
          title: pr.title,
          author: pr.user?.login || sender?.login,
          state,
          merged: !!mergedAt,
        },
      },
    });

    const broadcast: BroadcastActivityPayload = {
      type: 'PULL_REQUEST',
      action: activityAction,
      title: `PR #${pr.number}: ${pr.title}`,
      description: `State: ${state} by @${sender?.login || 'user'}`,
      actor: sender?.login || pr.user?.login || 'developer',
      actorAvatar: sender?.avatar_url || pr.user?.avatar_url,
      repositoryId: dbRepo.id,
      repositoryName: dbRepo.fullName,
      userId: dbRepo.userId || undefined,
      timestamp: new Date().toISOString(),
      metadata: activity.metadata,
    };

    return { pr: updatedPR, broadcast };
  }

  /**
   * Handle Issue Webhook Event
   */
  private static async handleIssueEvent(payload: any) {
    const { action, issue, repository: repo, sender } = payload;
    if (!issue || !repo) throw new Error('Invalid Issue payload structure');

    const repoGithubId = repo.id.toString();
    let dbRepo = await prisma.repository.findUnique({
      where: { githubId: repoGithubId },
    });

    if (!dbRepo) {
      dbRepo = await prisma.repository.create({
        data: {
          githubId: repoGithubId,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner?.login || sender?.login || 'unknown',
          htmlUrl: repo.html_url,
          isPrivate: repo.private || false,
        },
      });
    }

    const state: IssueState =
      issue.state === 'closed' || action === 'closed' ? IssueState.CLOSED : IssueState.OPEN;
    const closedAt = issue.closed_at ? new Date(issue.closed_at) : null;

    const updatedIssue = await prisma.issue.upsert({
      where: {
        repositoryId_number: {
          repositoryId: dbRepo.id,
          number: issue.number,
        },
      },
      update: {
        title: issue.title,
        description: issue.body,
        url: issue.html_url,
        state,
        closedAt,
      },
      create: {
        githubId: issue.id.toString(),
        number: issue.number,
        title: issue.title,
        description: issue.body,
        url: issue.html_url,
        state,
        repositoryId: dbRepo.id,
        closedAt,
      },
    });

    let activityAction = 'ISSUE_UPDATED';
    if (action === 'opened') activityAction = 'ISSUE_OPENED';
    else if (action === 'closed') activityAction = 'ISSUE_CLOSED';

    const activity = await prisma.activityLog.create({
      data: {
        action: activityAction,
        entityType: 'ISSUE',
        entityId: updatedIssue.id,
        repositoryId: dbRepo.id,
        metadata: {
          number: issue.number,
          title: issue.title,
          author: issue.user?.login || sender?.login,
          state,
        },
      },
    });

    const broadcast: BroadcastActivityPayload = {
      type: 'ISSUE',
      action: activityAction,
      title: `Issue #${issue.number}: ${issue.title}`,
      description: `Status: ${state} by @${sender?.login || 'user'}`,
      actor: sender?.login || issue.user?.login || 'developer',
      actorAvatar: sender?.avatar_url || issue.user?.avatar_url,
      repositoryId: dbRepo.id,
      repositoryName: dbRepo.fullName,
      userId: dbRepo.userId || undefined,
      timestamp: new Date().toISOString(),
      metadata: activity.metadata,
    };

    return { issue: updatedIssue, broadcast };
  }

  /**
   * Handle Push Webhook Event (Commits)
   */
  private static async handlePushEvent(payload: any) {
    const { commits, repository: repo, sender } = payload;
    if (!commits || !repo) throw new Error('Invalid Push payload structure');

    const repoGithubId = repo.id.toString();
    let dbRepo = await prisma.repository.findUnique({
      where: { githubId: repoGithubId },
    });

    if (!dbRepo) {
      dbRepo = await prisma.repository.create({
        data: {
          githubId: repoGithubId,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner?.login || sender?.login || 'unknown',
          htmlUrl: repo.html_url,
          isPrivate: repo.private || false,
        },
      });
    }

    let insertedCommitsCount = 0;

    for (const commit of commits) {
      await prisma.commit.upsert({
        where: {
          repositoryId_sha: {
            repositoryId: dbRepo.id,
            sha: commit.id || commit.sha,
          },
        },
        update: {
          message: commit.message,
          author: commit.author?.username || commit.author?.name || sender?.login,
          url: commit.url,
          committedAt: commit.timestamp ? new Date(commit.timestamp) : null,
        },
        create: {
          sha: commit.id || commit.sha,
          message: commit.message,
          author: commit.author?.username || commit.author?.name || sender?.login,
          url: commit.url,
          committedAt: commit.timestamp ? new Date(commit.timestamp) : null,
          repositoryId: dbRepo.id,
        },
      });

      insertedCommitsCount++;
    }

    const activity = await prisma.activityLog.create({
      data: {
        action: 'COMMITS_PUSHED',
        entityType: 'COMMIT',
        repositoryId: dbRepo.id,
        metadata: {
          count: insertedCommitsCount,
          pusher: sender?.login,
          headCommit: commits[commits.length - 1]?.message,
        },
      },
    });

    const broadcast: BroadcastActivityPayload = {
      type: 'PUSH',
      action: 'COMMITS_PUSHED',
      title: `${insertedCommitsCount} commit(s) pushed to ${dbRepo.name}`,
      description: `Latest: "${commits[commits.length - 1]?.message || 'Code changes'}" by @${sender?.login || 'developer'}`,
      actor: sender?.login || 'developer',
      actorAvatar: sender?.avatar_url,
      repositoryId: dbRepo.id,
      repositoryName: dbRepo.fullName,
      userId: dbRepo.userId || undefined,
      timestamp: new Date().toISOString(),
      metadata: activity.metadata,
    };

    return { count: insertedCommitsCount, broadcast };
  }
}
