// server/src/config/env.js
import fs from 'node:fs';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Auto-detect host vs Docker environment:
// If running on host (outside container) and DATABASE_URL uses the container hostname 'postgres:5432',
// transparently rewrite to 'localhost:5432' so local Node processes connect seamlessly.
if (!fs.existsSync('/.dockerenv') && process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@postgres:5432')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@postgres:5432', '@localhost:5432');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_EXPIRY_HOURS: z.coerce.number().int().min(1).max(720).default(24),
  COOKIE_SECURE: z.string().transform(v => v === 'true').default('false'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  SEED_ESTIMATOR_PASSWORD: z.string().default('Estimator@123'),
  SEED_SALES_PASSWORD: z.string().default('Sales@123'),
  APPROVAL_THRESHOLD: z.coerce.number().default(2500000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
