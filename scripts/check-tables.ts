import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('TABLES:', res.rows.map((r) => r.table_name));

  const users = await client.query('SELECT id, email, role FROM users');
  console.log('USERS IN DB:', users.rows);

  await client.end();
}

check().catch(console.error);
