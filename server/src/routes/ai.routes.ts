import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Secure AI Assistant Endpoints
router.use(authenticate);

// Natural Language Telemetry Queries
router.post('/ask', AIController.askAssistant);
router.get('/quick-prompts', AIController.getQuickPrompts);

// Automated AI Code Review & Security Audit
router.post('/review-pr/:prId', AIController.reviewPullRequest);
router.get('/reviews/:prId', AIController.getPRReviews);

export default router;
