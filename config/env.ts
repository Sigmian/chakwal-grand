// ============================================================
// config/env.ts
// Type-safe environment variable access.
//
// Validates all required env vars at startup.
// If a required variable is missing, the app fails fast
// with a clear error — not silently in production.
// ============================================================

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `❌ Missing required environment variable: ${name}\n` +
      `   Add it to your .env.local file.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

// ─── Validated Environment Config ────────────────────────────
export const env = {
  // Next.js
  NODE_ENV: optionalEnv("NODE_ENV", "development") as
    | "development"
    | "production"
    | "test",
  NEXTAUTH_URL:    requireEnv("NEXTAUTH_URL"),
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),

  // Database
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // AWS S3 (for image uploads)
  AWS_REGION:            optionalEnv("AWS_REGION", "ap-south-1"),
  AWS_ACCESS_KEY_ID:     optionalEnv("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: optionalEnv("AWS_SECRET_ACCESS_KEY"),
  AWS_S3_BUCKET:         optionalEnv("AWS_S3_BUCKET", "chakwal-grand-media"),

  // Email (Nodemailer)
  SMTP_HOST:     optionalEnv("SMTP_HOST"),
  SMTP_PORT:     Number(optionalEnv("SMTP_PORT", "587")),
  SMTP_USER:     optionalEnv("SMTP_USER"),
  SMTP_PASSWORD: optionalEnv("SMTP_PASSWORD"),
  FROM_EMAIL:    optionalEnv("FROM_EMAIL", "noreply@chakwalgrand.pk"),

  // Business
  WHATSAPP_NUMBER: optionalEnv("WHATSAPP_NUMBER", "923001234567"),
  COMPANY_NAME:    optionalEnv("COMPANY_NAME", "Chakwal Grand Guest House"),

  // Feature flags
  ENABLE_ONLINE_PAYMENTS: optionalEnv("ENABLE_ONLINE_PAYMENTS", "false") === "true",
  ENABLE_AI_CHATBOT:      optionalEnv("ENABLE_AI_CHATBOT", "false") === "true",

  // Analytics (future)
  GOOGLE_ANALYTICS_ID: optionalEnv("GOOGLE_ANALYTICS_ID"),

  // Helper
  isDev:  process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
} as const;
