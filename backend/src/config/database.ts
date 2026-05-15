import { Pool, type PoolClient, type QueryResultRow } from 'pg';

import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

let databaseStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

export async function connectDatabase() {
  try {
    databaseStatus = 'connecting';

    await pool.query('select 1');

    databaseStatus = 'connected';

    console.log('✅ Database connected');
  } catch (error) {
    databaseStatus = 'disconnected';

    console.error('❌ Database connection failed', error);

    throw error;
  }
}

export function getDatabaseStatus() {
  return databaseStatus;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
) {
  return pool.query<T>(text, [...params]);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
