import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIContextService } from '../services/ai-context.service';
import { AIService } from '../services/ai.service';
import { AIReviewService } from '../services/ai-review.service';
import { prisma } from '../config/database';

const querySchema = z.object({
  query: z
    .string({ required_error: 'Query string is required' })
    .min(2, 'Query must be at least 2 characters')
    .max(500, 'Query cannot exceed 500 characters'),
  repositoryId: z.string().optional(),
});

export class AIController {
  /**
   * 1. Query the AI Engineering Assistant with User-Scoped Context
   */
  static async askAssistant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsedBody = querySchema.safeParse(req.body);

      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_AI_QUERY',
            message: parsedBody.error.errors[0]?.message || 'Invalid query format',
          },
        });
      }

      const { query, repositoryId } = parsedBody.data;
      const userId = req.user!.id;

      // 1. Build sanitized, user-isolated engineering telemetry context from Neon DB
      const context = await AIContextService.buildEngineeringContext(userId, repositoryId);

      // 2. Query Google Gemini SDK or intelligent heuristics engine
      const answer = await AIService.queryAssistant(query, context);

      res.status(200).json({
        success: true,
        query,
        answer,
        timestamp: new Date().toISOString(),
        summary: context.summary,
      });
    } catch (error: any) {
      if (error.status === 429) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'AI_RATE_LIMITED',
            message: 'Gemini API rate limit exceeded. Please wait a moment before asking again.',
          },
        });
      }

      next(error);
    }
  }

  /**
   * 2. Trigger Automated AI Code Review & Security Audit for a Pull Request
   */
  static async reviewPullRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { prId } = req.params;
      const review = await AIReviewService.reviewPullRequest(prId);

      res.status(200).json({
        success: true,
        message: 'AI Code Review & Security scan completed successfully',
        data: {
          review,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Get Existing AI Reviews for a PR
   */
  static async getPRReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { prId } = req.params;
      const reviews = await prisma.prReview.findMany({
        where: { pullRequestId: prId },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: {
          reviews,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. Get Recommended Quick Prompts
   */
  static async getQuickPrompts(_req: AuthenticatedRequest, res: Response) {
    const prompts = [
      {
        id: 'stale-prs',
        label: 'PR Review Bottlenecks',
        prompt: 'Which PRs have been waiting for review for more than 24 hours?',
        icon: 'clock',
      },
      {
        id: 'daily-summary',
        label: "Today's Engineering Summary",
        prompt: "Summarize today's engineering team activity and velocity.",
        icon: 'pulse',
      },
      {
        id: 'turnaround',
        label: 'Issue Turnaround Analysis',
        prompt: 'Which repository has the highest issue turnaround turnaround?',
        icon: 'trending-up',
      },
      {
        id: 'health-check',
        label: 'Engineering Health Score',
        prompt: 'Give me an engineering health score and velocity recommendations.',
        icon: 'activity',
      },
    ];

    res.status(200).json({
      success: true,
      prompts,
    });
  }
}
