import { prisma } from '../config/database';
import { GitHubService } from './github.service';
import { decryptToken } from '../utils/crypto';
import { PRState, PRReviewStatus, IssueState } from '@prisma/client';

export class SyncService {
  /**
   * Helper to retrieve and decrypt user's GitHub access token
   */
  private static async getUserGitHubToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptedToken: true, username: true },
    });

    if (!user || !user.encryptedToken) {
      throw new Error(
        'No active GitHub access token found for user. Please re-authenticate via GitHub OAuth.'
      );
    }

    return decryptToken(user.encryptedToken);
  }

  /**
   * 1. Synchronize all repositories for the authenticated user
   */
  static async syncUserRepositories(userId: string) {
    const token = await this.getUserGitHubToken(userId);
    const githubRepos = await GitHubService.fetchAllUserRepositories(token);

    // Record activity log: Sync Started
    await prisma.activityLog.create({
      data: {
        action: 'REPOSITORIES_SYNC_STARTED',
        entityType: 'REPOSITORY',
        userId,
        metadata: { fetchedCount: githubRepos.length },
      },
    });

    const syncedRepos = [];

    for (const repo of githubRepos) {
      const githubIdStr = repo.id.toString();

      const syncedRepo = await prisma.repository.upsert({
        where: {
          githubId: githubIdStr,
        },
        update: {
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          description: repo.description,
          isPrivate: repo.private,
          defaultBranch: repo.default_branch,
          htmlUrl: repo.html_url,
          language: repo.language,
          starsCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          openIssuesCount: repo.open_issues_count,
          userId,
        },
        create: {
          githubId: githubIdStr,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          description: repo.description,
          isPrivate: repo.private,
          defaultBranch: repo.default_branch,
          htmlUrl: repo.html_url,
          language: repo.language,
          starsCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          openIssuesCount: repo.open_issues_count,
          userId,
        },
      });

      syncedRepos.push(syncedRepo);
    }

    // Record activity log: Sync Completed
    await prisma.activityLog.create({
      data: {
        action: 'REPOSITORIES_SYNC_COMPLETED',
        entityType: 'REPOSITORY',
        userId,
        metadata: { count: syncedRepos.length },
      },
    });

    return {
      success: true,
      count: syncedRepos.length,
      repositories: syncedRepos,
    };
  }

  /**
   * 2. Synchronize Pull Requests for a given repository
   */
  static async syncRepositoryPRs(repositoryId: string, userId: string) {
    const token = await this.getUserGitHubToken(userId);
    const repo = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repo) {
      throw new Error(`Repository not found with ID: ${repositoryId}`);
    }

    const githubPRs = await GitHubService.fetchRepositoryPullRequests(
      token,
      repo.owner,
      repo.name
    );

    let createdOrUpdatedCount = 0;

    for (const pr of githubPRs) {
      const githubIdStr = `${repo.githubId}_pr_${pr.id || pr.number}`;

      let state: PRState = PRState.OPEN;
      if (pr.merged_at) state = PRState.MERGED;
      else if (pr.state === 'closed') state = PRState.CLOSED;

      let reviewStatus: PRReviewStatus = PRReviewStatus.PENDING_REVIEW;
      if (pr.draft) reviewStatus = PRReviewStatus.DRAFT;

      await prisma.pullRequest.upsert({
        where: {
          repositoryId_number: {
            repositoryId: repo.id,
            number: pr.number,
          },
        },
        update: {
          title: pr.title,
          description: pr.body,
          url: pr.html_url,
          state,
          reviewStatus,
          closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        },
        create: {
          githubId: githubIdStr,
          number: pr.number,
          title: pr.title,
          description: pr.body,
          url: pr.html_url,
          state,
          reviewStatus,
          repositoryId: repo.id,
          authorId: userId,
          closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        },
      });

      createdOrUpdatedCount++;
    }

    await prisma.activityLog.create({
      data: {
        action: 'PULL_REQUESTS_SYNCED',
        entityType: 'PULL_REQUEST',
        userId,
        repositoryId: repo.id,
        metadata: { count: createdOrUpdatedCount },
      },
    });

    return {
      success: true,
      repository: repo.fullName,
      syncedCount: createdOrUpdatedCount,
    };
  }

  /**
   * 3. Synchronize Issues for a given repository
   */
  static async syncRepositoryIssues(repositoryId: string, userId: string) {
    const token = await this.getUserGitHubToken(userId);
    const repo = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repo) {
      throw new Error(`Repository not found with ID: ${repositoryId}`);
    }

    const githubIssues = await GitHubService.fetchRepositoryIssues(
      token,
      repo.owner,
      repo.name
    );

    let createdOrUpdatedCount = 0;

    for (const issue of githubIssues) {
      const githubIdStr = `${repo.githubId}_issue_${issue.id || issue.number}`;
      const state: IssueState = issue.state === 'closed' ? IssueState.CLOSED : IssueState.OPEN;

      await prisma.issue.upsert({
        where: {
          repositoryId_number: {
            repositoryId: repo.id,
            number: issue.number,
          },
        },
        update: {
          title: issue.title,
          description: issue.body,
          url: issue.html_url,
          state,
          closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
        },
        create: {
          githubId: githubIdStr,
          number: issue.number,
          title: issue.title,
          description: issue.body,
          url: issue.html_url,
          state,
          repositoryId: repo.id,
          assigneeId: userId,
          closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
        },
      });

      createdOrUpdatedCount++;
    }

    await prisma.activityLog.create({
      data: {
        action: 'ISSUES_SYNCED',
        entityType: 'ISSUE',
        userId,
        repositoryId: repo.id,
        metadata: { count: createdOrUpdatedCount },
      },
    });

    return {
      success: true,
      repository: repo.fullName,
      syncedCount: createdOrUpdatedCount,
    };
  }

  /**
   * 4. Synchronize Commits for a given repository
   */
  static async syncRepositoryCommits(repositoryId: string, userId: string) {
    const token = await this.getUserGitHubToken(userId);
    const repo = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repo) {
      throw new Error(`Repository not found with ID: ${repositoryId}`);
    }

    const githubCommits = await GitHubService.fetchRepositoryCommits(
      token,
      repo.owner,
      repo.name
    );

    let createdOrUpdatedCount = 0;

    for (const commit of githubCommits) {
      await prisma.commit.upsert({
        where: {
          repositoryId_sha: {
            repositoryId: repo.id,
            sha: commit.sha,
          },
        },
        update: {
          message: commit.commit.message,
          author: commit.author?.login || commit.commit.author.name,
          authorAvatar: commit.author?.avatar_url,
          url: commit.html_url,
          committedAt: commit.commit.author.date ? new Date(commit.commit.author.date) : null,
        },
        create: {
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.author?.login || commit.commit.author.name,
          authorAvatar: commit.author?.avatar_url,
          url: commit.html_url,
          committedAt: commit.commit.author.date ? new Date(commit.commit.author.date) : null,
          repositoryId: repo.id,
        },
      });

      createdOrUpdatedCount++;
    }

    await prisma.activityLog.create({
      data: {
        action: 'COMMITS_SYNCED',
        entityType: 'COMMIT',
        userId,
        repositoryId: repo.id,
        metadata: { count: createdOrUpdatedCount },
      },
    });

    return {
      success: true,
      repository: repo.fullName,
      syncedCount: createdOrUpdatedCount,
    };
  }

  /**
   * 5. Master Sync Engine: Sequentially sync repositories, then PRs, Issues, and Commits
   */
  static async syncAll(userId: string) {
    // Step 1: Sync all user repositories
    const repoSyncResult = await this.syncUserRepositories(userId);

    let totalPRsSynced = 0;
    let totalIssuesSynced = 0;
    let totalCommitsSynced = 0;

    // Step 2: Iterate over each synced repository and pull telemetry
    for (const repo of repoSyncResult.repositories) {
      try {
        const [prRes, issueRes, commitRes] = await Promise.all([
          this.syncRepositoryPRs(repo.id, userId),
          this.syncRepositoryIssues(repo.id, userId),
          this.syncRepositoryCommits(repo.id, userId),
        ]);

        totalPRsSynced += prRes.syncedCount;
        totalIssuesSynced += issueRes.syncedCount;
        totalCommitsSynced += commitRes.syncedCount;
      } catch (err: any) {
        console.error(`Partial sync error on repo ${repo.fullName}:`, err.message);
      }
    }

    // Step 3: Record Master Sync Log
    await prisma.activityLog.create({
      data: {
        action: 'MASTER_SYNC_COMPLETED',
        entityType: 'WORKSPACE',
        userId,
        metadata: {
          repositoriesCount: repoSyncResult.count,
          prsCount: totalPRsSynced,
          issuesCount: totalIssuesSynced,
          commitsCount: totalCommitsSynced,
        },
      },
    });

    return {
      success: true,
      summary: {
        repositoriesSynced: repoSyncResult.count,
        pullRequestsSynced: totalPRsSynced,
        issuesSynced: totalIssuesSynced,
        commitsSynced: totalCommitsSynced,
      },
    };
  }
}
