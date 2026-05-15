import type { Role } from '../constants/roles.js';
import { query } from '../config/database.js';
import type { MemberRecord } from '../types/index.js';
import { normalizeName } from '../utils/normalize.js';

export interface MemberRow {
  id: string;
  ministry_id: string;
  name: string;
  normalized_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  rules: unknown;
  roles: Role[];
  created_at: Date | string;
  updated_at: Date | string;
}

export interface MemberLookupRow {
  id: string;
  name: string;
  normalized_name: string;
}

interface MemberInput {
  ministryId: string;
  name: string;
  normalizedName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  roles: Role[];
}

function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function buildFallbackEmail(normalizedName: string) {
  const slug = normalizedName.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  return `${slug || 'membro'}@sem-email.local`;
}

export function toMemberRecord(row: MemberRow): MemberRecord {
  return {
    id: row.id,
    name: row.name,
    roles: row.roles,
    notes: row.notes ?? undefined,
    createdAt: toIsoDate(row.created_at),
    updatedAt: toIsoDate(row.updated_at),
  };
}

export async function findMembers(ministryId: string) {
  const result = await query<MemberRow>(
    `
      SELECT *
      FROM members
      WHERE ministry_id = $1
      ORDER BY name ASC
    `,
    [ministryId],
  );

  return result.rows;
}

export async function findMemberLookups(ministryId: string) {
  const result = await query<MemberLookupRow>(
    `
      SELECT id, name, normalized_name
      FROM members
      WHERE ministry_id = $1
      ORDER BY name ASC
    `,
    [ministryId],
  );

  return result.rows;
}

export async function findMemberById(id: string) {
  const result = await query<MemberRow>(
    `
      SELECT *
      FROM members
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function createMember(input: MemberInput) {
  const normalizedName = input.normalizedName ?? normalizeName(input.name);
  const email = input.email?.trim() || buildFallbackEmail(normalizedName);

  const result = await query<MemberRow>(
    `
      INSERT INTO members (
        ministry_id,
        name,
        normalized_name,
        email,
        phone,
        notes,
        roles
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING *
    `,
    [
      input.ministryId,
      input.name,
      normalizedName,
      email,
      input.phone?.trim() || null,
      input.notes ?? null,
      JSON.stringify(input.roles),
    ],
  );

  return result.rows[0];
}

export async function updateMember(id: string, input: Omit<MemberInput, 'ministryId'>) {
  const normalizedName = input.normalizedName ?? normalizeName(input.name);
  const email = input.email?.trim() || buildFallbackEmail(normalizedName);

  const result = await query<MemberRow>(
    `
      UPDATE members
      SET name            = $2,
          normalized_name = $3,
          email           = $4,
          phone           = $5,
          notes           = $6,
          roles           = $7::jsonb
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      input.name,
      normalizedName,
      email,
      input.phone?.trim() || null,
      input.notes ?? null,
      JSON.stringify(input.roles),
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteMember(id: string) {
  const result = await query<MemberRow>(
    `
      DELETE FROM members
      WHERE id = $1
      RETURNING *
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
