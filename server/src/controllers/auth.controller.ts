import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { z } from 'zod';
import { GitHubService } from '../services/github.service';
import { AuthService, STATE_COOKIE_NAME } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { encryptToken } from '../utils/crypto';
import { env } from '../config/env';
import { Role } from '@prisma/client';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&#)'
    ),
  confirmPassword: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
});

const loginSchema = z.object({
  email: z.string().min(3, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  /**
   * 1. Register with Email & Password (bcrypt cost factor 12)
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Invalid input data',
          },
        });
      }

      const { email: rawEmail, password, name, confirmPassword } = parsed.data;

      // Confirm Password check
      if (confirmPassword && confirmPassword !== password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PASSWORD_MISMATCH',
            message: 'Passwords do not match.',
          },
        });
      }

      const email = rawEmail.toLowerCase().trim();
      const derivedUsername =
        parsed.data.username ||
        email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') + `_${Math.floor(Math.random() * 1000)}`;

      // Check if user with this email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username: derivedUsername }],
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'An account with this email already exists. Please sign in instead.',
          },
        });
      }

      // Hash password using bcrypt with 12 salt rounds
      const passwordHash = await bcrypt.hash(password, 12);

      // Check if this is the first user in the system to grant ADMIN, otherwise DEVELOPER
      const totalUsers = await prisma.user.count();
      const defaultRole: Role = totalUsers === 0 ? Role.ADMIN : Role.DEVELOPER;

      // Create PostgreSQL User Record with LOCAL authProvider
      const user = await prisma.user.create({
        data: {
          email,
          username: derivedUsername,
          name: name.trim(),
          passwordHash,
          authProvider: 'LOCAL',
          role: defaultRole,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${derivedUsername}`,
        },
      });

      // Generate minimal JWT & Set HttpOnly cookie
      const token = AuthService.generateToken(user);
      AuthService.setAuthCookie(res, token);

      const { passwordHash: _h, encryptedToken: _e, ...safeUser } = user as any;

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: { user: safeUser },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Login with Email & Password (Strict Backend Authoritative)
   */
  static async loginWithPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email or password.',
          },
        });
      }

      const rawEmailOrUsername = parsed.data.email.trim();
      const normalizedEmail = rawEmailOrUsername.toLowerCase();
      const { password } = parsed.data;

      // Find user by normalized email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { username: rawEmailOrUsername }],
        },
      });

      // Generic error: never reveal whether the user exists, reject if user not found or has no passwordHash
      if (!user || !user.passwordHash) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        });
      }

      // If user registered with OAuth and has no local password
      if (user.authProvider !== 'LOCAL' && !user.passwordHash) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password. Please use your OAuth provider to log in.',
          },
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        });
      }

      // Generate minimal JWT & Set HttpOnly cookie
      const token = AuthService.generateToken(user);
      AuthService.setAuthCookie(res, token);

      const { passwordHash: _h, encryptedToken: _e, ...safeUser } = user as any;

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: { user: safeUser },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Initiate Google OAuth Flow with CSRF State Protection
   */
  static initiateGoogleAuth(_req: Request, res: Response) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_ID.startsWith('mock_')) {
      return res.redirect(
        `${env.CLIENT_URL}/login?error=${encodeURIComponent(
          'Google OAuth is not configured in server/.env. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
        )}`
      );
    }

    const state = crypto.randomBytes(24).toString('hex');
    AuthService.setStateCookie(res, state);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
      env.GOOGLE_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
      env.GOOGLE_CALLBACK_URL
    )}&response_type=code&scope=${encodeURIComponent(
      'openid email profile'
    )}&state=${state}&access_type=offline&prompt=consent`;

    res.redirect(googleAuthUrl);
  }

  /**
   * 4. Handle Google OAuth Callback (CSRF State Verification & Verified Profile)
   */
  static async handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error: googleError } = req.query;

      if (googleError) {
        return res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(
            'Google authentication was cancelled or failed.'
          )}`
        );
      }

      const storedState = req.cookies?.[STATE_COOKIE_NAME];

      if (!state || !storedState || state !== storedState) {
        AuthService.clearStateCookie(res);
        return res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(
            'OAuth security state mismatch (CSRF protection). Please try again.'
          )}`
        );
      }

      AuthService.clearStateCookie(res);

      if (!code || typeof code !== 'string') {
        return res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(
            'Authorization code missing from Google response.'
          )}`
        );
      }

      // Exchange code for tokens with Google
      const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: env.GOOGLE_CALLBACK_URL,
      });

      const { access_token } = tokenRes.data;

      // Fetch verified user profile from Google UserInfo endpoint
      const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const googleProfile = userinfoRes.data;
      const googleId = googleProfile.sub;
      const email = googleProfile.email?.toLowerCase().trim();
      const name = googleProfile.name || googleProfile.given_name || 'Google User';
      const avatarUrl = googleProfile.picture;
      const derivedUsername = email ? email.split('@')[0] : `google_user_${googleId.substring(0, 6)}`;

      if (!email) {
        return res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(
            'Google account did not provide a verified email address.'
          )}`
        );
      }

      // Account linking / find or create
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            name: user.name || name,
            avatarUrl: user.avatarUrl || avatarUrl,
          },
        });
      } else {
        const totalUsers = await prisma.user.count();
        const defaultRole: Role = totalUsers === 0 ? Role.ADMIN : Role.DEVELOPER;

        user = await prisma.user.create({
          data: {
            email,
            username: derivedUsername,
            name,
            avatarUrl,
            googleId,
            authProvider: 'GOOGLE',
            role: defaultRole,
            encryptedToken: access_token ? encryptToken(access_token) : null,
          },
        });
      }

      const token = AuthService.generateToken(user);
      AuthService.setAuthCookie(res, token);

      return res.redirect(`${env.CLIENT_URL}/dashboard`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.redirect(
        `${env.CLIENT_URL}/login?error=${encodeURIComponent(
          'Google authentication failed. Please try again.'
        )}`
      );
    }
  }

  /**
   * 5. Initiate GitHub OAuth Flow with CSRF State Protection
   */
  static initiateGitHubAuth(_req: Request, res: Response) {
    if (
      !env.GITHUB_CLIENT_ID ||
      !env.GITHUB_CLIENT_SECRET ||
      env.GITHUB_CLIENT_ID === 'mock_client_id' ||
      env.GITHUB_CLIENT_ID.startsWith('mock_')
    ) {
      return res.redirect(
        `${env.CLIENT_URL}/login?error=${encodeURIComponent(
          'GitHub OAuth is not configured in server/.env. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
        )}`
      );
    }

    const state = crypto.randomBytes(24).toString('hex');
    AuthService.setStateCookie(res, state);

    const authUrl = GitHubService.getAuthorizationUrl(state);
    res.redirect(authUrl);
  }

  /**
   * 6. Handle GitHub OAuth Callback (CSRF State Verification & AES-256-GCM Cipher)
   */
  static async handleGitHubCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error: ghError } = req.query;

      if (ghError) {
        return res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(
            'GitHub authentication was cancelled or failed.'
          )}`
        );
      }

      const storedState = req.cookies?.[STATE_COOKIE_NAME];

      if (!state || !storedState || state !== storedState) {
        AuthService.clearStateCookie(res);
        return res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(
            'OAuth security state mismatch (CSRF protection). Please try again.'
          )}`
        );
      }

      AuthService.clearStateCookie(res);

      if (!code || typeof code !== 'string') {
        return res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(
            'Authorization code missing from GitHub callback.'
          )}`
        );
      }

      const accessToken = await GitHubService.exchangeCodeForToken(code);
      const profile = await GitHubService.fetchUserProfile(accessToken);

      // Strict Admin Access Control: Enforce GitHub Whitelist
      if (env.ALLOWED_GITHUB_USERS) {
        const allowedList = env.ALLOWED_GITHUB_USERS.split(',').map((u) => u.trim().toLowerCase());
        const currentUserLogin = profile.login.toLowerCase().trim();
        if (!allowedList.includes(currentUserLogin)) {
          console.warn(`🚨 Unauthorized GitHub login attempt blocked: @${profile.login}`);
          return res.redirect(
            `${env.CLIENT_URL}/login?error=${encodeURIComponent(
              `Access Denied: Your GitHub account (@${profile.login}) is not in the authorized Admin whitelist.`
            )}`
          );
        }
      }

      const { user, token } = await AuthService.upsertGitHubUser(profile, accessToken);

      AuthService.setAuthCookie(res, token);

      return res.redirect(`${env.CLIENT_URL}/dashboard`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      return res.redirect(
        `${env.CLIENT_URL}/login?error=${encodeURIComponent(
          'GitHub authentication failed. Please check your credentials.'
        )}`
      );
    }
  }

  /**
   * 7. Instant Demo Login (Isolated Explicit Endpoint)
   */
  static async devLogin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!env.DEMO_LOGIN_ENABLED) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Demo login is disabled.',
          },
        });
      }

      const demoEmail = 'demo.developer@commandcenter.dev';
      const demoUsername = 'demo-developer';

      let user = await prisma.user.findFirst({
        where: { email: demoEmail },
      });

      if (!user) {
        const totalUsers = await prisma.user.count();
        const role: Role = totalUsers === 0 ? Role.ADMIN : Role.DEVELOPER;

        user = await prisma.user.create({
          data: {
            email: demoEmail,
            username: demoUsername,
            name: 'Demo Developer',
            authProvider: 'LOCAL',
            role,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${demoUsername}`,
          },
        });
      }

      const token = AuthService.generateToken(user);
      AuthService.setAuthCookie(res, token);

      const { encryptedToken: _hidden, passwordHash: _p, ...safeUser } = user as any;

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully via Demo Access',
        data: { user: safeUser },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 8. Get Current Authenticated User Profile (Session Restoration)
   */
  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
    }

    const { encryptedToken: _hidden, passwordHash: _p, ...safeUser } = req.user as any;

    res.status(200).json({
      success: true,
      data: {
        user: safeUser,
      },
    });
  }

  /**
   * 9. Real Session Termination & Logout
   */
  static async logout(_req: Request, res: Response) {
    AuthService.clearAuthCookie(res);
    AuthService.clearStateCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session terminated.',
    });
  }
}
