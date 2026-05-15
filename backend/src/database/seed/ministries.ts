import { type PoolClient } from 'pg';

import { IDS } from './constants.js';

interface MinistrySeed {
  id: string;
  userId: string;
  name: string;
  roles: string[];
  rules: Record<string, unknown>;
}

const MINISTRIES: MinistrySeed[] = [
  {
    id: IDS.MINISTRY_WORSHIP,
    userId: IDS.USER_ADMIN,
    name: 'Louvor',
    roles: ['Vocal', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Violão'],
    rules: {},
  },
];

export async function seedMinistries(client: PoolClient): Promise<void> {
  console.log('  🎵 Seeding ministries...');

  for (const ministry of MINISTRIES) {
    await client.query(
      `
      INSERT INTO ministries (id, user_id, name, roles, rules)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, name) DO NOTHING
      `,
      [
        ministry.id,
        ministry.userId,
        ministry.name,
        JSON.stringify(ministry.roles),
        JSON.stringify(ministry.rules),
      ],
    );
  }

  console.log(`  ✅ Ministries seeded (${MINISTRIES.length} records)`);
}
