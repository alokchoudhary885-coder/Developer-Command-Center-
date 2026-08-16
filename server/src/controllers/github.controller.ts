import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { SyncService } from '../services/sync.service';
import { prisma } from '../config/database';
import { PRState, IssueState } from '@prisma/client';

export class GitHubController {
  /**
   * 1. Get all synced repositories for the current user
   */
  static async getRepositories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const repositories = await prisma.repository.findMany({
        where: { OR: [{ userId }, { userId: null }] },
        include: {
          _count: {
            select: {
              pullRequests: true,
              issues: true,
              commits: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        count: repositories.length,
        data: {
          repositories,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Trigger on-demand sync of user's GitHub repositories
   */
  static async syncRepositories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await SyncService.syncUserRepositories(userId);

      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * 3. Get repository details including PRs, Issues, and Commits
   */
  static async getRepositoryDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { repoId } = req.params;
      const repository = await prisma.repository.findUnique({
        where: { id: repoId },
        include: {
          pullRequests: { orderBy: { updatedAt: 'desc' }, take: 20 },
          issues: { orderBy: { updatedAt: 'desc' }, take: 20 },
          commits: { orderBy: { committedAt: 'desc' }, take: 20 },
        },
      });

      if (!repository) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Repository not found' },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          repository,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. Get Pull Requests with optional state filter (OPEN | CLOSED | MERGED)
   */
  static async getPullRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { state, repoId } = req.query;

      const where: any = {};
      if (state && Object.values(PRState).includes(state as PRState)) {
        where.state = state as PRState;
      }
      if (repoId && typeof repoId === 'string') {
        where.repositoryId = repoId;
      }

      const pullRequests = await prisma.pullRequest.findMany({
        where,
        include: {
          repository: { select: { name: true, fullName: true } },
          author: { select: { username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        count: pullRequests.length,
        data: {
          pullRequests,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 5. Get Issues with optional state filter (OPEN | CLOSED)
   */
  static async getIssues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { state, repoId } = req.query;

      const where: any = {};
      if (state && Object.values(IssueState).includes(state as IssueState)) {
        where.state = state as IssueState;
      }
      if (repoId && typeof repoId === 'string') {
        where.repositoryId = repoId;
      }

      const issues = await prisma.issue.findMany({
        where,
        include: {
          repository: { select: { name: true, fullName: true } },
          assignee: { select: { username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        count: issues.length,
        data: {
          issues,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. Get Commits telemetry stream
   */
  static async getCommits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { repoId } = req.query;

      const where: any = {};
      if (repoId && typeof repoId === 'string') {
        where.repositoryId = repoId;
      }

      const commits = await prisma.commit.findMany({
        where,
        include: {
          repository: { select: { name: true, fullName: true } },
        },
        orderBy: { committedAt: 'desc' },
        take: 50,
      });

      res.status(200).json({
        success: true,
        count: commits.length,
        data: {
          commits,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. Sync PRs for a repository
   */
  static async syncPullRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { repoId } = req.params;
      const result = await SyncService.syncRepositoryPRs(repoId, req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 8. Sync Issues for a repository
   */
  static async syncIssues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { repoId } = req.params;
      const result = await SyncService.syncRepositoryIssues(repoId, req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 9. Sync Commits for a repository
   */
  static async syncCommits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { repoId } = req.params;
      const result = await SyncService.syncRepositoryCommits(repoId, req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 10. Full Workspace Master Sync (All repositories, PRs, Issues, and Commits)
   */
  static async syncAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await SyncService.syncAll(req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 11. Get Activity Log feed
   */
  static async getActivityFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const activities = await prisma.activityLog.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.status(200).json({
        success: true,
        count: activities.length,
        data: {
          activities,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
