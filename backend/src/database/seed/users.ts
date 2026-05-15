import bcrypt from 'bcryptjs';
import { type PoolClient } from 'pg';

import { IDS } from './constants.js';

const SALT_ROUNDS = 12;

export async function seedUsers(client: PoolClient): Promise<void> {
  console.log('  👤 Seeding users...');

  const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);

  await client.query(
    `
    INSERT INTO users (id, email, password_hash, church_name, church_phone, settings)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO NOTHING
    `,
    [
      IDS.USER_ADMIN,
      'admin@igreja.com',
      passwordHash,
      'Igreja Central',
      null,
      JSON.stringify({}),
    ],
  );

  console.log('  ✅ Users seeded');
}
