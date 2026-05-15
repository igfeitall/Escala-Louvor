import { query } from '../config/database.js';
import { ensureDefaultWorkspace } from './defaultWorkspaceRepository.js';

export interface ServiceTypeRow {
  id: string;
  user_id: string;
  name: string;
  weekday: number;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export async function findServiceTypesByDefaultUser() {
  const { userId } = await ensureDefaultWorkspace();
  const result = await query<ServiceTypeRow>(
    `
      select *
      from service_types
      where user_id = $1
      order by sort_order asc, name asc
    `,
    [userId],
  );

  return result.rows;
}
