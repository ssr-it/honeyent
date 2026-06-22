import { Pool, QueryResult } from 'pg';
import { config } from './index.ts';

const pool = new Pool({
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`Executed query in ${duration}ms`, { text, params });
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

export const getClient = async () => {
    return pool.connect();
};

export default pool;
