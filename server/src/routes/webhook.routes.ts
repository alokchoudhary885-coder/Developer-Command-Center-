import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// Live GitHub Webhook endpoint
router.post('/github', WebhookController.handleGitHubWebhook);

// Dev Simulation endpoint
router.post('/simulate', WebhookController.simulateWebhook);

export default router;
