import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { BroadcastService } from '../services/broadcast.service';
import { DeploymentStatus } from '@prisma/client';

export class DeploymentController {
  /**
   * 1. Get all deployments across tracked repositories
   */
  static async getDeployments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deployments = await prisma.deployment.findMany({
        include: {
          repository: { select: { name: true, fullName: true } },
          triggeredBy: { select: { username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      const total = deployments.length;
      const successCount = deployments.filter((d) => d.status === 'SUCCESS').length;
      const successRate = total > 0 ? `${Math.round((successCount / total) * 100)}%` : '100%';

      res.status(200).json({
        success: true,
        summary: {
          totalDeployments: total,
          successRate,
          activePipelines: deployments.filter((d) => d.status === 'IN_PROGRESS').length,
        },
        data: {
          deployments,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Trigger or simulate CI/CD Deployment pipeline event
   */
  static async triggerDeployment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { repositoryId, environment = 'Production', status = DeploymentStatus.SUCCESS, commitSha } = req.body;

      const repo = repositoryId
        ? await prisma.repository.findUnique({ where: { id: repositoryId } })
        : await prisma.repository.findFirst();

      if (!repo) {
        return res.status(404).json({ success: false, error: { message: 'No repository found' } });
      }

      const deployment = await prisma.deployment.create({
        data: {
          repositoryId: repo.id,
          environment,
          status: status as DeploymentStatus,
          commitSha: commitSha || 'e8f1c4a',
          triggeredById: req.user!.id,
          url: `https://deployment.dev-org.internal/${environment.toLowerCase()}`,
        },
        include: {
          repository: { select: { name: true } },
        },
      });

      // Broadcast deployment event
      BroadcastService.emitActivity({
        type: 'DEPLOYMENT',
        action: `DEPLOYMENT_${status}`,
        title: `Deployment ${status}: ${repo.name} (${environment})`,
        description: `Triggered by @${req.user!.username} on commit ${deployment.commitSha?.substring(0, 7)}`,
        actor: req.user!.username,
        repositoryId: repo.id,
        repositoryName: repo.fullName,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: `Deployment to ${environment} recorded`,
        deployment,
      });
    } catch (error) {
      next(error);
    }
  }
}
