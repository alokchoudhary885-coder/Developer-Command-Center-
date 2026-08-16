import { Response } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { GitHubUserProfile } from './github.service';
import { signToken } from '../utils/jwt';
import { encryptToken } from '../utils/crypto';
import { Role } from '@prisma/client';

export const AUTH_COOKIE_NAME = 'auth_token';
export const STATE_COOKIE_NAME = 'oauth_state';

export class AuthService {
  static generateToken(user: { id: string; role: Role }) {
    return signToken({
      sub: user.id,
      role: user.role,
    });
  }

  static async upsertGitHubUser(profile: GitHubUserProfile, accessToken?: string, overrideRole?: Role) {
    const githubIdStr = profile.id.toString();

    // Check if this is the first user in the system to grant ADMIN, otherwise DEVELOPER
    const existingUsersCount = await prisma.user.count();
    const defaultRole: Role = overrideRole || (existingUsersCount === 0 ? Role.ADMIN : Role.DEVELOPER);

    // Encrypt token securely using AES-256-GCM before saving to PostgreSQL
    const encryptedToken = accessToken ? encryptToken(accessToken) : undefined;

    const user = await prisma.user.upsert({
      where: {
        githubId: githubIdStr,
      },
      update: {
        username: profile.login,
        name: profile.name || profile.login,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        ...(overrideRole && { role: overrideRole }),
        ...(encryptedToken && { encryptedToken }),
      },
      create: {
        githubId: githubIdStr,
        username: profile.login,
        name: profile.name || profile.login,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        role: defaultRole,
        encryptedToken,
      },
    });

    const token = this.generateToken(user);

    // Strip encryptedToken from returned user object in memory for safety
    const { encryptedToken: _hidden, ...safeUser } = user;

    return { user: safeUser, token };
  }

  static async upsertGoogleUser(profile: {
    googleId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    accessToken?: string;
  }) {
    const { googleId, email, name, avatarUrl, accessToken } = profile;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if this is the first user in the system to grant ADMIN, otherwise DEVELOPER
    const existingUsersCount = await prisma.user.count();
    const defaultRole: Role = existingUsersCount === 0 ? Role.ADMIN : Role.DEVELOPER;

    const encryptedToken = accessToken ? encryptToken(accessToken) : undefined;

    // 1. Try to find user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email: normalizedEmail }],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          name: user.name || name || 'Google User',
          avatarUrl: user.avatarUrl || avatarUrl,
          ...(encryptedToken && { encryptedToken }),
        },
      });
    } else {
      // Generate a guaranteed unique username
      let baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
      if (!baseUsername) baseUsername = `user_${googleId.slice(0, 6)}`;
      let uniqueUsername = baseUsername;
      let counter = 1;

      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
        counter++;
        if (counter > 10) {
          uniqueUsername = `${baseUsername}_${Date.now()}`;
          break;
        }
      }

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          username: uniqueUsername,
          name: name || 'Google User',
          avatarUrl,
          googleId,
          authProvider: 'GOOGLE',
          role: defaultRole,
          ...(encryptedToken && { encryptedToken }),
        },
      });
    }

    const token = this.generateToken(user);
    const { encryptedToken: _hidden, passwordHash: _p, ...safeUser } = user as any;

    return { user: safeUser, token };
  }

  static setAuthCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  static setStateCookie(res: Response, state: string) {
    res.cookie(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    });
  }

  static clearAuthCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
  }

  static clearStateCookie(res: Response) {
    res.clearCookie(STATE_COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
  }
}
