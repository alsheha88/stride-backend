import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url(),
  ACCESS_TOKEN_SECRET: z.string().min(64),
  REFRESH_TOKEN_SECRET: z.string().min(64),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  console.error(result.error.issues);
  process.exit(1);
}

export const env = result.data;