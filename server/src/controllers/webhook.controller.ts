import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';
import { env } from '../config/env';

export class WebhookController {
  /**
   * 1. Live GitHub Webhook Handler with HMAC SHA-256 Security & Delivery Deduplication
   */
  static async handleGitHubWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const eventType = req.headers['x-github-event'] as string;
      const deliveryId = req.headers['x-github-delivery'] as string;

      // Extract raw body string for cryptographic HMAC signature verification
      const rawPayload = (req as any).rawBody || JSON.stringify(req.body);

      // Verify HMAC SHA-256 signature
      const isValid = WebhookService.verifySignature(rawPayload, signature);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_WEBHOOK_SIGNATURE',
            message: 'HMAC SHA-256 signature verification failed.',
          },
        });
      }

      if (!eventType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_EVENT_HEADER',
            message: 'Missing X-GitHub-Event header.',
          },
        });
      }

      const result = await WebhookService.processWebhookEvent(
        eventType,
        req.body,
        deliveryId
      );

      return res.status(200).json({
        success: true,
        message: `GitHub webhook event '${eventType}' processed successfully`,
        deliveryId,
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Simulated Webhook endpoint (Protected: dev mode or internal testing)
   */
  static async simulateWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      if (env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Webhook simulation is disabled in production environment.',
          },
        });
      }

      const { eventType = 'pull_request', payload, deliveryId } = req.body;

      if (!payload) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PAYLOAD', message: 'Simulated payload is required' },
        });
      }

      const result = await WebhookService.processWebhookEvent(
        eventType,
        payload,
        deliveryId
      );

      return res.status(200).json({
        success: true,
        message: `Simulated '${eventType}' webhook processed and broadcasted via Socket.IO`,
        result,
      });
    } catch (error) {
      next(error);
    }
  }
}
