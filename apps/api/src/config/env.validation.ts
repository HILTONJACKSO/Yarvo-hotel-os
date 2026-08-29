import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),
  COOKIE_SECURE: z.string().default('false'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  RATE_LIMIT_TTL: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_TTL: z.coerce.number().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('json'),

  SWAGGER_ENABLED: z.string().default('false'),
  SWAGGER_PATH: z.string().default('api/docs'),

  FRONTEND_URL: z.string().default('http://localhost:3000'),

  PUBLIC_API_KEY: z.string().min(10, 'PUBLIC_API_KEY must be at least 10 characters').optional(),
});

export type EnvVars = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): EnvVars {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`\n❌ Environment validation failed:\n${messages}\n`);
  }
  return result.data;
}

