import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const authRateLimitMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 15; // Max 15 attempts per window per IP

export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-client-ip';
  const now = Date.now();

  const record = authRateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    authRateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((record.resetTime - now) / (60 * 1000));
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: `Too many authentication attempts. Please try again in ${minutesLeft} minute(s).`,
      },
    });
  }

  record.count += 1;
  next();
};
