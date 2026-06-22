import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER || process.env.DATABASE_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'honeyent_db',
});

const client = await pool.connect();
try {
  await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_no VARCHAR(50)");
  await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE");
  await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_remark TEXT");
  await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP");
  console.log('OK');
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
