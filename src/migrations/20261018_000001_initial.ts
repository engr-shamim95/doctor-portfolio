import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Enable UUID extension
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // 2. Create Core Chambers Table
  await db.execute(sql`
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

  // 3. Create Schedules Table
  await db.execute(sql`
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
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_schedule_times CHECK ("end_time" > "start_time")
    );

    CREATE INDEX IF NOT EXISTS "idx_schedules_chamber_day" 
    ON "schedules" ("chamber_id", "day_of_week") 
    WHERE "is_active" = TRUE;
  `);

  // 4. Create Leaves & Holiday Exceptions Table
  await db.execute(sql`
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
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_leave_dates CHECK ("end_date" >= "start_date")
    );

    CREATE INDEX IF NOT EXISTS "idx_leaves_dates" 
    ON "leaves" ("start_date", "end_date");
  `);

  // 5. Create Core Appointments Table
  await db.execute(sql`
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

  // 6. Mandatory Partial Unique Indexes for Anti-Double-Booking Concurrency Control
  await db.execute(sql`
    -- Anti-Double-Booking for Slot Mode
    CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_chamber_slot" 
    ON "appointments" ("chamber_id", "slot_start") 
    WHERE "status" IN ('PENDING', 'CONFIRMED');

    -- Anti-Duplicate Queue Token for Serial Mode
    CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_chamber_serial" 
    ON "appointments" ("chamber_id", "appointment_date", "serial_number") 
    WHERE "status" IN ('PENDING', 'CONFIRMED');

    -- Reference Code Uniqueness Index
    CREATE UNIQUE INDEX IF NOT EXISTS "unique_appointment_reference_code" 
    ON "appointments" ("reference_code");

    -- Performance Query Indexes
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
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "unique_active_chamber_slot";
    DROP INDEX IF EXISTS "unique_active_chamber_serial";
    DROP INDEX IF EXISTS "unique_appointment_reference_code";
    DROP INDEX IF EXISTS "idx_appointments_chamber_date";
    DROP INDEX IF EXISTS "idx_appointments_patient_phone";
    DROP INDEX IF EXISTS "idx_appointments_status";
    DROP INDEX IF EXISTS "idx_appointments_expires_at";
    DROP TABLE IF EXISTS "appointments" CASCADE;
    DROP TABLE IF EXISTS "leaves" CASCADE;
    DROP TABLE IF EXISTS "schedules" CASCADE;
    DROP TABLE IF EXISTS "chambers" CASCADE;
  `);
}
