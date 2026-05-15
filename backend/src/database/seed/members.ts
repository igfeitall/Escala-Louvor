import { type PoolClient } from 'pg';

import { IDS } from './constants.js';
import { normalizeName } from './helpers.js';

interface MemberSeed {
  id: string;
  ministryId: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  roles: string[];
  rules: Record<string, unknown>;
}

const MEMBERS: MemberSeed[] = [
  // ── Apoio ────────────────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_ROBERTO,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Roberto',
    email: 'roberto@igreja.com',
    roles: ['Apoio'],
    rules: {},
  },
  {
    id: IDS.MEMBER_THAISA,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Thaisa',
    email: 'thaisa@igreja.com',
    roles: ['Apoio'],
    rules: {},
  },

  // ── Ministro / Vocal ─────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_THAYNA,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Thayna',
    email: 'thayna@igreja.com',
    roles: ['Ministro', 'Apoio', 'Bateria'],
    rules: {},
  },
  {
    id: IDS.MEMBER_BARBARA,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Bárbara',
    email: 'barbara@igreja.com',
    roles: ['Ministro', 'Apoio'],
    rules: {},
  },
  {
    id: IDS.MEMBER_THAMIRYS,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Thamirys',
    email: 'thamirys@igreja.com',
    roles: ['Ministro', 'Apoio', 'Teclado'],
    rules: {},
  },
  {
    id: IDS.MEMBER_LIGIA,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Lígia',
    email: 'ligia@igreja.com',
    roles: ['Ministro', 'Apoio'],
    rules: {},
  },

  // ── Guitarra / Baixo ─────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_GABRIEL,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Gabriel',
    email: 'gabriel@igreja.com',
    roles: ['Guitarra', 'Baixo'],
    rules: {},
  },

  // ── Baixo / Bateria ──────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_THUA,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Thuã',
    email: 'thua@igreja.com',
    roles: ['Baixo', 'Bateria'],
    rules: {},
  },

  // ── Violão / Baixo ───────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_IGOR,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Igor',
    email: 'igor@igreja.com',
    roles: ['Violão', 'Baixo'],
    rules: {},
  },

  // ── Bateria ──────────────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_BENJAMIN,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Benjamin',
    email: 'benjamin@igreja.com',
    roles: ['Bateria'],
    rules: {},
  },
  {
    id: IDS.MEMBER_MATEUS,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Mateus',
    email: 'mateus@igreja.com',
    roles: ['Bateria'],
    rules: {},
  },

  // ── Violão ───────────────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_YAN,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Yan',
    email: 'yan@igreja.com',
    roles: ['Violão'],
    rules: {},
  },

  // ── Teclado ──────────────────────────────────────────────────────────────────
  {
    id: IDS.MEMBER_MARIA,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Maria',
    email: 'maria@igreja.com',
    roles: ['Teclado'],
    rules: {},
  },
  {
    id: IDS.MEMBER_SAMUEL,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Samuel',
    email: 'samuel@igreja.com',
    roles: ['Teclado'],
    rules: {},
  },

  // ── Violão / Baixo / Bateria ─────────────────────────────────────────────────
  {
    id: IDS.MEMBER_PABLO,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Pablo',
    email: 'pablo@igreja.com',
    roles: ['Violão', 'Baixo', 'Bateria'],
    rules: {},
  },

  // ── Violão / Guitarra / Teclado / Baixo ──────────────────────────────────────
  {
    id: IDS.MEMBER_DAVI,
    ministryId: IDS.MINISTRY_WORSHIP,
    name: 'Davi',
    email: 'davi@igreja.com',
    roles: ['Violão', 'Guitarra', 'Teclado', 'Baixo'],
    rules: {},
  },
];

export async function seedMembers(client: PoolClient): Promise<void> {
  console.log('  🎸 Seeding members...');

  for (const member of MEMBERS) {
    await client.query(
      `
      INSERT INTO members (
        id,
        ministry_id,
        name,
        normalized_name,
        email,
        phone,
        notes,
        roles,
        rules
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        ministry_id     = EXCLUDED.ministry_id,
        name            = EXCLUDED.name,
        normalized_name = EXCLUDED.normalized_name,
        email           = EXCLUDED.email,
        phone           = EXCLUDED.phone,
        notes           = EXCLUDED.notes,
        roles           = EXCLUDED.roles,
        rules           = EXCLUDED.rules
      `,
      [
        member.id,
        member.ministryId,
        member.name,
        normalizeName(member.name),
        member.email,
        member.phone ?? null,
        member.notes ?? null,
        JSON.stringify(member.roles),
        JSON.stringify(member.rules),
      ],
    );
  }

  console.log(`  ✅ Members seeded (${MEMBERS.length} records)`);
}
