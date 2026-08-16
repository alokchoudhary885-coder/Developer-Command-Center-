import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val.trim(), 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173').transform((v) => v.trim().replace(/\/+$/, '')),
  JWT_SECRET: z.string().default('development-secret-change-in-production').transform((v) => v.trim()),
  ENCRYPTION_KEY: z
    .string()
    .default('c3f190a6e4d29381c0ab5827e892ef61203498ab5671239845cdfa1234567890')
    .transform((v) => v.trim().replace(/\s+/g, '')),
  DATABASE_URL: z.string().optional().transform((v) => v?.trim()),
  GITHUB_CLIENT_ID: z.string().optional().transform((v) => v?.trim().replace(/\s+/g, '')),
  GITHUB_CLIENT_SECRET: z.string().optional().transform((v) => v?.trim().replace(/\s+/g, '')),
  GITHUB_CALLBACK_URL: z
    .string()
    .default('http://localhost:5000/api/auth/github/callback')
    .transform((v) => v.trim()),
  GOOGLE_CLIENT_ID: z.string().optional().transform((v) => v?.trim().replace(/\s+/g, '')),
  GOOGLE_CLIENT_SECRET: z.string().optional().transform((v) => v?.trim().replace(/\s+/g, '')),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default('http://localhost:5000/api/auth/google/callback')
    .transform((v) => v.trim()),
  GITHUB_WEBHOOK_SECRET: z
    .string()
    .default('dev_cmd_center_webhook_secret_998877')
    .transform((v) => v.trim()),
  GEMINI_API_KEY: z.string().optional().transform((v) => v?.trim()),
  DEMO_LOGIN_ENABLED: z.string().default('true').transform((v) => v === 'true'),
  ALLOWED_GITHUB_USERS: z.string().optional().transform((v) => v?.trim()),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
