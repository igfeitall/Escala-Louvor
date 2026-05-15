import { query } from '../config/database.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  church_name: string;
  church_phone: string | null;
  settings: unknown;
  created_at: Date | string;
  updated_at: Date | string;
}

export async function findUserByEmail(email: string) {
  const result = await query<UserRow>(
    `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await query<UserRow>(
    `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
