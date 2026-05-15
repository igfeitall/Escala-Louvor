import { type PoolClient } from 'pg';

import { IDS } from './constants.js';

interface ServiceTypeSeed {
  id: string;
  userId: string;
  name: string;
  weekday: number; // 0=domingo, 1=segunda, ..., 6=sábado
  sortOrder: number;
}

const SERVICE_TYPES: ServiceTypeSeed[] = [
  {
    id: IDS.SERVICE_SUNDAY_MORNING,
    userId: IDS.USER_ADMIN,
    name: 'Culto Domingo Manhã',
    weekday: 0,
    sortOrder: 1,
  },
  {
    id: IDS.SERVICE_SUNDAY_NIGHT,
    userId: IDS.USER_ADMIN,
    name: 'Culto Domingo Noite',
    weekday: 0,
    sortOrder: 2,
  },
  {
    id: IDS.SERVICE_WEDNESDAY,
    userId: IDS.USER_ADMIN,
    name: 'Culto Quarta',
    weekday: 3,
    sortOrder: 3,
  },
];

export async function seedServiceTypes(client: PoolClient): Promise<void> {
  console.log('  📅 Seeding service types...');

  for (const st of SERVICE_TYPES) {
    await client.query(
      `
      INSERT INTO service_types (id, user_id, name, weekday, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, name) DO NOTHING
      `,
      [st.id, st.userId, st.name, st.weekday, st.sortOrder],
    );
  }

  console.log(`  ✅ Service types seeded (${SERVICE_TYPES.length} records)`);
}
