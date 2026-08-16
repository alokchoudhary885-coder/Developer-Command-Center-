import { Router } from 'express';
import { DeploymentController } from '../controllers/deployment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', DeploymentController.getDeployments);
router.post(
  '/trigger',
  requireRole([Role.TECH_LEAD, Role.ENGINEERING_MANAGER, Role.ADMIN]),
  DeploymentController.triggerDeployment
);

export default router;

