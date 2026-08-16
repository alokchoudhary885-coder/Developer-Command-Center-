import { Router } from 'express';
import { DoraController } from '../controllers/dora.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', DoraController.getMetrics);

export default router;
