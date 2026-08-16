import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// 1. Email & Password Registration & Login (Protected with Rate Limiter)
router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.loginWithPassword);

// 2. Google OAuth 2.0 (Gmail)
router.get('/google', AuthController.initiateGoogleAuth);
router.get('/google/callback', AuthController.handleGoogleCallback);

// 3. GitHub OAuth 2.0
router.get('/github', AuthController.initiateGitHubAuth);
router.get('/github/callback', AuthController.handleGitHubCallback);

// 4. Instant Dev Demo Login
router.post('/dev-login', AuthController.devLogin);

// 5. Session Management & Profile
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/logout', authenticate, AuthController.logout);

export default router;
