import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || process.env.DATABASE_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'honeyent_db',
});

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT table_schema, table_name, column_name, character_maximum_length
            FROM information_schema.columns
            WHERE data_type = 'character varying'
                AND character_maximum_length IS NOT NULL
                AND character_maximum_length = 15
            ORDER BY table_schema, table_name;
        `);

        console.log('Columns with varchar length <= 15:');
        for (const row of res.rows) {
            console.log(`${row.table_schema}.${row.table_name}.${row.column_name} -> ${row.character_maximum_length}`);
        }
    } catch (err) {
        console.error('Inspect failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
