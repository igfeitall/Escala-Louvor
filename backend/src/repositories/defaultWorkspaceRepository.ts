import type { PoolClient } from 'pg';

import { ROLE_LABELS, ROLE_OPTIONS } from '../constants/roles.js';
import { SERVICE_LABELS, SERVICE_TYPE_ORDER } from '../constants/services.js';
import { query, withTransaction } from '../config/database.js';
import type { ServiceType } from '../types/index.js';

interface WorkspaceContext {
  userId: string;
  ministryId: string;
  serviceTypesByCode: Map<ServiceType, string>;
}

interface IdRow {
  id: string;
}

interface ServiceTypeRow {
  id: string;
  name: string;
}

const DEFAULT_USER_EMAIL = 'igreja.local@escala-louvor.local';
const DEFAULT_CHURCH_NAME = 'Igreja Local';
const DEFAULT_MINISTRY_NAME = 'Louvor';
const DEFAULT_PASSWORD_HASH = 'local-development-password';

const DEFAULT_SERVICE_TYPES: Array<{
  code: ServiceType;
  name: string;
  weekday: number;
  sortOrder: number;
}> = [
  {
    code: 'SUNDAY_MORNING',
    name: SERVICE_LABELS.SUNDAY_MORNING,
    weekday: 0,
    sortOrder: 10,
  },
  {
    code: 'SUNDAY_EVENING',
    name: SERVICE_LABELS.SUNDAY_EVENING,
    weekday: 0,
    sortOrder: 20,
  },
  {
    code: 'WEDNESDAY',
    name: SERVICE_LABELS.WEDNESDAY,
    weekday: 3,
    sortOrder: 30,
  },
];

let cachedContext: WorkspaceContext | null = null;

async function ensureUser(client: PoolClient) {
  const result = await client.query<IdRow>(
    `
      with inserted as (
        insert into users (email, password_hash, church_name)
        values ($1, $2, $3)
        on conflict (email) do nothing
        returning id
      )
      select id from inserted
      union all
      select id from users where email = $1
      limit 1
    `,
    [DEFAULT_USER_EMAIL, DEFAULT_PASSWORD_HASH, DEFAULT_CHURCH_NAME],
  );

  return result.rows[0].id;
}

async function ensureMinistry(client: PoolClient, userId: string) {
  const roles = ROLE_OPTIONS.map((role) => ({ name: ROLE_LABELS[role] }));
  const result = await client.query<IdRow>(
    `
      with inserted as (
        insert into ministries (user_id, name, roles)
        values ($1, $2, $3::jsonb)
        on conflict (user_id, name) do nothing
        returning id
      )
      select id from inserted
      union all
      select id from ministries where user_id = $1 and name = $2
      limit 1
    `,
    [userId, DEFAULT_MINISTRY_NAME, JSON.stringify(roles)],
  );

  return result.rows[0].id;
}

async function ensureServiceTypes(client: PoolClient, userId: string) {
  for (const serviceType of DEFAULT_SERVICE_TYPES) {
    await client.query(
      `
        insert into service_types (user_id, name, weekday, sort_order)
        values ($1, $2, $3, $4)
        on conflict (user_id, name) do update
        set weekday = excluded.weekday,
            sort_order = excluded.sort_order
      `,
      [userId, serviceType.name, serviceType.weekday, serviceType.sortOrder],
    );
  }

  const result = await client.query<ServiceTypeRow>(
    `
      select id, name
      from service_types
      where user_id = $1
    `,
    [userId],
  );

  const idsByName = new Map(result.rows.map((row) => [row.name, row.id]));
  const idsByCode = new Map<ServiceType, string>();

  for (const serviceType of DEFAULT_SERVICE_TYPES) {
    const id = idsByName.get(serviceType.name);

    if (id) {
      idsByCode.set(serviceType.code, id);
    }
  }

  return idsByCode;
}

export async function ensureDefaultWorkspace() {
  if (cachedContext) {
    return cachedContext;
  }

  cachedContext = await withTransaction(async (client) => {
    const userId = await ensureUser(client);
    const ministryId = await ensureMinistry(client, userId);
    const serviceTypesByCode = await ensureServiceTypes(client, userId);

    return {
      userId,
      ministryId,
      serviceTypesByCode,
    };
  });

  return cachedContext;
}

export async function getDefaultServiceTypesByCode() {
  return (await ensureDefaultWorkspace()).serviceTypesByCode;
}

export async function getDefaultServiceTypeCodesById() {
  const { userId } = await ensureDefaultWorkspace();
  const result = await query<ServiceTypeRow>(
    `
      select id, name
      from service_types
      where user_id = $1
      order by sort_order asc, name asc
    `,
    [userId],
  );

  const codeByName = new Map(DEFAULT_SERVICE_TYPES.map((serviceType) => [
    serviceType.name,
    serviceType.code,
  ]));

  return new Map(
    result.rows
      .map((row) => {
        const code = codeByName.get(row.name);
        return code ? ([row.id, code] as const) : null;
      })
      .filter((entry): entry is readonly [string, ServiceType] => entry !== null),
  );
}

export function getDefaultServiceTypeCodeByName(name: string) {
  return DEFAULT_SERVICE_TYPES.find((serviceType) => serviceType.name === name)?.code ?? null;
}

export function getDefaultServiceTypeName(code: ServiceType) {
  return DEFAULT_SERVICE_TYPES.find((serviceType) => serviceType.code === code)?.name ?? null;
}

export function isDefaultServiceType(value: string): value is ServiceType {
  return SERVICE_TYPE_ORDER.includes(value as ServiceType);
}
