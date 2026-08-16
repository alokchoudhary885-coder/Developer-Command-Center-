import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AlertService } from '../services/alert.service';

export class AlertController {
  static async sendTestAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { webhookUrl, type = 'PR_BOTTLENECK' } = req.body;

      if (!webhookUrl) {
        return res.status(200).json({
          success: true,
          simulated: true,
          message: 'Simulated webhook alert dispatch successful (No external URL provided)',
          samplePayload: {
            title: '⚠️ Stale Pull Request Alert (#142)',
            description: 'PR #142 in telemetry-engine has been unreviewed for 28 hours. Immediate tech lead review requested.',
            severity: 'WARNING',
            type: 'PR_BOTTLENECK',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const result = await AlertService.sendAlert(webhookUrl, {
        title: '⚠️ Developer Command Center Test Notification',
        description: `Live test notification sent by @${req.user!.username} from Developer Command Center.`,
        severity: 'INFO',
        type: 'TEST_NOTIFICATION',
        metadata: {
          User: req.user!.username,
          Role: req.user!.role,
          Platform: 'Developer Command Center',
        },
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
