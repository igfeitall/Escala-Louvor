import { query } from '../config/database.js';
import { ensureDefaultWorkspace } from './defaultWorkspaceRepository.js';

export interface MinistryRow {
  id: string;
  user_id: string;
  name: string;
  roles: unknown;
  rules: unknown;
  created_at: Date | string;
  updated_at: Date | string;
}

export async function findDefaultMinistry() {
  const { ministryId } = await ensureDefaultWorkspace();
  const result = await query<MinistryRow>(
    `
      select *
      from ministries
      where id = $1
      limit 1
    `,
    [ministryId],
  );

  return result.rows[0] ?? null;
}

export async function findMinistriesByDefaultUser() {
  const { userId } = await ensureDefaultWorkspace();
  const result = await query<MinistryRow>(
    `
      select *
      from ministries
      where user_id = $1
      order by name asc
    `,
    [userId],
  );

  return result.rows;
}
