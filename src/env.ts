import { z } from 'zod';

/**
 * Server-only environment variables schema.
 * Never exposed to the browser bundle.
 */
const serverSchema = z.object({
  // Runtime Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // PostgreSQL Database Connection
  DATABASE_URI: z
    .string({ required_error: 'DATABASE_URI is required' })
    .min(1, 'DATABASE_URI cannot be empty')
    .regex(/^(postgresql|postgres):\/\/.+/, {
      message: 'DATABASE_URI must be a valid PostgreSQL connection string starting with postgresql:// or postgres://',
    }),

  // Payload CMS Cryptographic Secret
  PAYLOAD_SECRET: z
    .string({ required_error: 'PAYLOAD_SECRET is required' })
    .min(32, { message: 'PAYLOAD_SECRET must be at least 32 characters long for cryptographic security' }),

  // Secret for HMAC-SHA256 Signed Management/Cancellation Links
  APPOINTMENT_SIGNING_SECRET: z
    .string()
    .min(32, { message: 'APPOINTMENT_SIGNING_SECRET must be at least 32 characters long' })
    .optional(),

  // OTP Configuration
  OTP_PROVIDER: z.enum(['mock', 'sms']).default('mock'),
  OTP_SECRET: z
    .string()
    .min(16, { message: 'OTP_SECRET must be at least 16 characters for secure hashing' })
    .default('dev-otp-secret-key-min-16-chars'),
  OTP_EXPIRY_SECONDS: z.coerce.number().int().positive().default(300), // 5 minutes TTL

  // SMS Gateway Configuration (Optional in mock mode)
  SMS_GATEWAY_URL: z.string().url().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),

  // Transactional Email / SMTP (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().default('Dr. Appointment Portal'),
  SMTP_FROM_EMAIL: z.string().email().optional(),
});

/**
 * Client-accessible environment variables schema.
 * All keys MUST be prefixed with NEXT_PUBLIC_.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SERVER_URL: z
    .string({ required_error: 'NEXT_PUBLIC_SERVER_URL is required' })
    .url({ message: 'NEXT_PUBLIC_SERVER_URL must be a valid absolute URL (e.g. http://localhost:3000)' }),

  NEXT_PUBLIC_APP_TIMEZONE: z.string().default('Asia/Dhaka'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['bn', 'en']).default('bn'),
  NEXT_PUBLIC_SITE_NAME: z.string().default('Dr. Specialized Clinical Care'),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/, {
      message: 'NEXT_PUBLIC_WHATSAPP_NUMBER must be in valid Bangladesh format (+8801XXXXXXXXX)',
    })
    .default('+8801700000000'),
});

/**
 * Combined Schema for Full Runtime Validation
 */
const mergedSchema = serverSchema.merge(clientSchema);

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type Env = z.infer<typeof mergedSchema>;

/**
 * Validates process.env against the combined schema.
 * Throws a formatted error if validation fails.
 */
export function validateEnv(): Env {
  const isServer = typeof window === 'undefined';

  // In the browser, only validate public client variables
  if (!isServer) {
    const clientResult = clientSchema.safeParse(process.env);
    if (!clientResult.success) {
      console.error('❌ Client Environment Validation Error:', clientResult.error.format());
      throw new Error('Invalid client-side environment configuration');
    }
    return clientResult.data as Env;
  }

  // On the server, validate both server and client schemas
  // Fallback APPOINTMENT_SIGNING_SECRET to PAYLOAD_SECRET if omitted
  const rawEnv = {
    ...process.env,
    APPOINTMENT_SIGNING_SECRET: process.env.APPOINTMENT_SIGNING_SECRET || process.env.PAYLOAD_SECRET,
    NEXT_PUBLIC_APP_TIMEZONE: process.env.NEXT_PUBLIC_APP_TIMEZONE || process.env.TIMEZONE || 'Asia/Dhaka',
  };

  const result = mergedSchema.safeParse(rawEnv);

  if (!result.success) {
    console.error('\n=============================================================');
    console.error('❌ CRITICAL CONFIGURATION ERROR: INVALID ENVIRONMENT VARIABLES');
    console.error('=============================================================');
    const formattedErrors = result.error.format();
    
    for (const [key, issues] of Object.entries(formattedErrors)) {
      if (key === '_errors') continue;
      const issueList = (issues as { _errors?: string[] })._errors || [];
      if (issueList.length > 0) {
        console.error(`  ▸ [${key}]: ${issueList.join('; ')}`);
      }
    }
    console.error('\nPlease inspect .env against .env.example and provide valid keys.\n');
    throw new Error('Environment configuration validation failed');
  }

  return result.data;
}

// Global cached validated environment object
export const env = validateEnv();
