import nextEnv from '@next/env';
import pg from 'pg';

// 1. Load environment configuration
const projectDir = process.cwd();
const loadEnvConfig = (nextEnv as any).loadEnvConfig || (nextEnv as any).default?.loadEnvConfig;
loadEnvConfig(projectDir);

const connectionString = process.env.DATABASE_URI;

if (!connectionString) {
  console.error('❌ DATABASE_URI environment variable is missing.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
  console.log('🚀 Running database migrations & concurrency index verification...');
  const startTime = Date.now();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "schema_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Enable pgcrypto
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 3. Create chambers table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "chambers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" VARCHAR(100) UNIQUE NOT NULL,
        "name_bn" VARCHAR(255) NOT NULL,
        "name_en" VARCHAR(255) NOT NULL,
        "hospital_or_center_bn" VARCHAR(255),
        "hospital_or_center_en" VARCHAR(255),
        "address_bn" TEXT NOT NULL,
        "address_en" TEXT NOT NULL,
        "city" VARCHAR(100) NOT NULL DEFAULT 'Dhaka',
        "contact_number" VARCHAR(30) NOT NULL,
        "google_maps_url" TEXT,
        "booking_mode" VARCHAR(20) NOT NULL DEFAULT 'SLOT' CHECK ("booking_mode" IN ('SLOT', 'SERIAL')),
        "consultation_fee" INT NOT NULL DEFAULT 1000,
        "follow_up_fee" INT NOT NULL DEFAULT 600,
        "follow_up_period_days" INT NOT NULL DEFAULT 14,
        "slot_duration_minutes" INT NOT NULL DEFAULT 15,
        "buffer_minutes" INT NOT NULL DEFAULT 5,
        "max_patients_per_session" INT NOT NULL DEFAULT 25,
        "lead_time_hours" INT NOT NULL DEFAULT 2,
        "max_advance_days" INT NOT NULL DEFAULT 30,
        "room_number" VARCHAR(50),
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "sort_order" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Create schedules table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "schedules" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "chamber_id" UUID NOT NULL REFERENCES "chambers"("id") ON DELETE CASCADE,
        "day_of_week" INT NOT NULL CHECK ("day_of_week" BETWEEN 0 AND 6),
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "slot_duration_minutes" INT,
        "buffer_minutes" INT DEFAULT 0,
        "max_patients" INT,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_schedules_chamber_day" ON "schedules" ("chamber_id", "day_of_week") WHERE "is_active" = TRUE;
    `);

    // 5. Create leaves table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "leaves" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "chamber_id" UUID REFERENCES "chambers"("id") ON DELETE CASCADE,
        "title_bn" VARCHAR(255) NOT NULL,
        "title_en" VARCHAR(255) NOT NULL,
        "start_date" TIMESTAMPTZ NOT NULL,
        "end_date" TIMESTAMPTZ NOT NULL,
        "type" VARCHAR(30) NOT NULL DEFAULT 'HOLIDAY' CHECK ("type" IN ('HOLIDAY', 'EMERGENCY_LEAVE', 'CONFERENCE', 'PERSONAL')),
        "notes" TEXT,
        "notify_affected_patients" BOOLEAN NOT NULL DEFAULT TRUE,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_leaves_dates" ON "leaves" ("start_date", "end_date");
    `);

    // 6. Create appointments table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "reference_code" VARCHAR(32) NOT NULL,
        "chamber_id" UUID NOT NULL REFERENCES "chambers"("id") ON DELETE RESTRICT,
        "booking_mode" VARCHAR(20) NOT NULL CHECK ("booking_mode" IN ('SLOT', 'SERIAL')),
        "appointment_date" DATE NOT NULL,
        "slot_start" TIMESTAMPTZ,
        "slot_end" TIMESTAMPTZ,
        "serial_number" INT,
        "patient_name" VARCHAR(150) NOT NULL,
        "patient_phone" VARCHAR(30) NOT NULL,
        "patient_email" VARCHAR(255),
        "patient_gender" VARCHAR(20) NOT NULL CHECK ("patient_gender" IN ('MALE', 'FEMALE', 'OTHER')),
        "patient_age" INT NOT NULL CHECK ("patient_age" > 0),
        "patient_problem_summary" TEXT,
        "is_walk_in" BOOLEAN NOT NULL DEFAULT FALSE,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
        "cancellation_reason" TEXT,
        "cancelled_at" TIMESTAMPTZ,
        "cancelled_by" VARCHAR(50),
        "verification_token" VARCHAR(255),
        "otp_hash" VARCHAR(255),
        "otp_expires_at" TIMESTAMPTZ,
        "otp_attempts" INT NOT NULL DEFAULT 0,
        "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "consultation_fee" INT,
        "payment_status" VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK ("payment_status" IN ('UNPAID', 'PAID', 'EXEMPT')),
        "notes_internal" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 7. CRITICAL PARTIAL UNIQUE INDEXES FOR ANTI-DOUBLE-BOOKING CONCURRENCY PROTECTION
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_chamber_slot" 
      ON "appointments" ("chamber_id", "slot_start") 
      WHERE "status" IN ('PENDING', 'CONFIRMED');

      CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_chamber_serial" 
      ON "appointments" ("chamber_id", "appointment_date", "serial_number") 
      WHERE "status" IN ('PENDING', 'CONFIRMED');

      CREATE UNIQUE INDEX IF NOT EXISTS "unique_appointment_reference_code" 
      ON "appointments" ("reference_code");

      CREATE INDEX IF NOT EXISTS "idx_appointments_chamber_date" 
      ON "appointments" ("chamber_id", "appointment_date");

      CREATE INDEX IF NOT EXISTS "idx_appointments_patient_phone" 
      ON "appointments" ("patient_phone");

      CREATE INDEX IF NOT EXISTS "idx_appointments_status" 
      ON "appointments" ("status");

      CREATE INDEX IF NOT EXISTS "idx_appointments_expires_at" 
      ON "appointments" ("otp_expires_at") 
      WHERE "status" = 'PENDING';
    `);

    // 8. Record migration entry
    await client.query(`
      INSERT INTO "schema_migrations" ("name") 
      VALUES ('20261018_000001_initial_concurrency_schema') 
      ON CONFLICT ("name") DO NOTHING;
    `);

    await client.query('COMMIT');

    const duration = Date.now() - startTime;
    console.log(`✅ All database tables & concurrency indexes applied successfully in ${duration}ms.`);
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
