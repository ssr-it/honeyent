require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || process.env.DATABASE_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'honeyent_db',
});

(async () => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT column_name, data_type, is_nullable, character_maximum_length FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position"
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
