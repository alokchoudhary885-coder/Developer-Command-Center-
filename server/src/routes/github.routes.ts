import { Router } from 'express';
import { GitHubController } from '../controllers/github.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware to all GitHub sync & data endpoints
router.use(authenticate);

// Read-only: all authenticated users
router.get('/repositories', GitHubController.getRepositories);
router.get('/repositories/:repoId', GitHubController.getRepositoryDetails);
router.get('/pull-requests', GitHubController.getPullRequests);
router.get('/issues', GitHubController.getIssues);
router.get('/commits', GitHubController.getCommits);
router.get('/activity', GitHubController.getActivityFeed);

// Write/Sync: require TECH_LEAD or above
const syncGuard = requireRole([Role.TECH_LEAD, Role.ENGINEERING_MANAGER, Role.ADMIN]);
router.post('/sync/repositories', syncGuard, GitHubController.syncRepositories);
router.post('/sync/repositories/:repoId/pulls', syncGuard, GitHubController.syncPullRequests);
router.post('/sync/repositories/:repoId/issues', syncGuard, GitHubController.syncIssues);
router.post('/sync/repositories/:repoId/commits', syncGuard, GitHubController.syncCommits);
router.post('/sync/all', syncGuard, GitHubController.syncAll);

export default router;

