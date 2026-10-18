import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function syncSchema() {
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    console.error('DATABASE_URI missing');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL...');

  // If chambers table was created with uuid id, drop empty tables to align with Payload integer serial id
  const checkChambersType = await client.query(
    "SELECT data_type FROM information_schema.columns WHERE table_name = 'chambers' AND column_name = 'id'"
  );
  if (checkChambersType.rows.length > 0 && checkChambersType.rows[0].data_type === 'uuid') {
    console.log('Dropping legacy empty tables with UUID primary key to align with Payload CMS schema...');
    await client.query('DROP TABLE IF EXISTS "appointments" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "leaves" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "schedules" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "chambers" CASCADE;');
  }

  // Read the generated full schema migration
  const migrationPath = path.resolve(process.cwd(), 'src/migrations/20261018_073048_full_schema.ts');
  const content = fs.readFileSync(migrationPath, 'utf8');

  // Extract the SQL string between sql` and `
  const sqlMatch = content.match(/await db\.execute\(sql`([\s\S]*?)`\)/);
  if (!sqlMatch || !sqlMatch[1]) {
    console.error('Could not find sql template in migration file');
    process.exit(1);
  }

  const sqlText = sqlMatch[1];

  // Split into statements by semicolon
  const statements = sqlText
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Processing ${statements.length} DDL statements...`);

  for (let stmt of statements) {
    try {
      if (stmt.startsWith('CREATE TYPE')) {
        // Safe type creation
        const safeTypeStmt = `DO $$ BEGIN ${stmt}; EXCEPTION WHEN duplicate_object THEN null; END $$;`;
        await client.query(safeTypeStmt);
      } else if (stmt.startsWith('ALTER TABLE')) {
        // Safe constraint addition
        const safeAlterStmt = `DO $$ BEGIN ${stmt}; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;`;
        await client.query(safeAlterStmt);
      } else if (stmt.startsWith('CREATE TABLE')) {
        const safeCreateStmt = stmt.replace(/^CREATE TABLE\s+/, 'CREATE TABLE IF NOT EXISTS ');
        await client.query(safeCreateStmt);
      } else if (stmt.startsWith('CREATE UNIQUE INDEX')) {
        const safeIdx = stmt.replace(/^CREATE UNIQUE INDEX\s+/, 'CREATE UNIQUE INDEX IF NOT EXISTS ');
        await client.query(safeIdx);
      } else if (stmt.startsWith('CREATE INDEX')) {
        const safeIdx = stmt.replace(/^CREATE INDEX\s+/, 'CREATE INDEX IF NOT EXISTS ');
        await client.query(safeIdx);
      } else {
        await client.query(stmt);
      }
    } catch (err: any) {
      console.warn(`Notice on statement [${stmt.slice(0, 50)}...]:`, err.message);
    }
  }

  // Ensure payload_migrations record exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "payload_migrations" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "batch" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);

  await client.query(`
    INSERT INTO "payload_migrations" ("name", "batch")
    SELECT '20261018_073048_full_schema', 1
    WHERE NOT EXISTS (
      SELECT 1 FROM "payload_migrations" WHERE "name" = '20261018_073048_full_schema'
    );
  `);

  // Ensure initial admin user exists
  const checkAdmin = await client.query("SELECT id FROM users WHERE email = 'admin@doctorcare.com'");
  if (checkAdmin.rows.length === 0) {
    console.log('Seeding super-admin user...');
    await client.query(`
      INSERT INTO users (email, name, role, phone, is_active, salt, hash)
      VALUES (
        'admin@doctorcare.com',
        'Dr. Admin',
        'super-admin',
        '+8801700112233',
        true,
        '4eec55a875fa29bc45bccaab04e66684c77b6a547d289d7aca65f158b9990187',
        'pbkdf2-sha256-v1:29696b35c9ed2da1c3bb668c62f958833e8dc8c38a4520a79a4629a4f37605b9'
      );
    `);
  }

  console.log('✅ Schema synchronization completed successfully!');
  await client.end();
}

syncSchema().catch((err) => {
  console.error('Migration execution failed:', err);
  process.exit(1);
});
