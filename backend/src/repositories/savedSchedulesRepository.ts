import type { PoolClient } from 'pg';

import { ROLE_LABELS, type Role } from '../constants/roles.js';
import { SERVICE_LABELS } from '../constants/services.js';
import { query, withTransaction } from '../config/database.js';
import type { ScheduleEntry, ServiceType } from '../types/index.js';
import { normalizeName } from '../utils/normalize.js';
import { getServiceTypeCodeByName, type WorkspaceContext } from './workspaceRepository.js';
import { findMembers } from './membersRepository.js';

interface IdRow {
  id: string;
}

interface SavedScheduleServiceRow {
  service_id: string;
  service_date: Date | string;
  service_type_name: string;
  notes: string | null;
  role_name: string | null;
  member_name: string | null;
}

type AssignmentEntryKey =
  | 'minister'
  | 'apoio'
  | 'violao'
  | 'guitarra'
  | 'teclado'
  | 'baixo'
  | 'bateria';

const ROLE_ENTRY_KEYS: Record<Role, AssignmentEntryKey> = {
  MINISTRO: 'minister',
  APOIO: 'apoio',
  VIOLAO: 'violao',
  GUITARRA: 'guitarra',
  TECLADO: 'teclado',
  BAIXO: 'baixo',
  BATERIA: 'bateria',
};

function toScheduleMonth(month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function toDateString(value: Date | string) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

async function upsertSavedSchedule(
  client: PoolClient,
  ministryId: string,
  scheduleMonth: string,
) {
  const result = await client.query<IdRow>(
    `
      INSERT INTO saved_schedules (ministry_id, schedule_month)
      VALUES ($1, $2)
      ON CONFLICT (ministry_id, schedule_month) DO UPDATE
      SET generated_at = now()
      RETURNING id
    `,
    [ministryId, scheduleMonth],
  );

  return result.rows[0].id;
}

async function insertSavedScheduleService(
  client: PoolClient,
  savedScheduleId: string,
  entry: ScheduleEntry,
  serviceTypeId: string,
) {
  const result = await client.query<IdRow>(
    `
      INSERT INTO saved_schedule_services (
        saved_schedule_id,
        service_date,
        service_type_id,
        notes
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [savedScheduleId, entry.date, serviceTypeId, entry.notes],
  );

  return result.rows[0].id;
}

async function insertAssignment(
  client: PoolClient,
  savedScheduleServiceId: string,
  roleName: string,
  memberId: string,
) {
  await client.query(
    `
      INSERT INTO saved_schedule_assignments (
        saved_schedule_service_id,
        role_name,
        member_id,
        slot_index
      )
      VALUES ($1, $2, $3, 1)
    `,
    [savedScheduleServiceId, roleName, memberId],
  );
}

export async function saveSchedule(
  month: number,
  year: number,
  schedule: ScheduleEntry[],
  workspace: WorkspaceContext,
) {
  const scheduleMonth = toScheduleMonth(month, year);
  const members = await findMembers(workspace.ministryId);
  const memberIdsByName = new Map(
    members.map((member) => [normalizeName(member.name), member.id]),
  );

  await withTransaction(async (client) => {
    const savedScheduleId = await upsertSavedSchedule(
      client,
      workspace.ministryId,
      scheduleMonth,
    );

    await client.query(
      `
        DELETE FROM saved_schedule_services
        WHERE saved_schedule_id = $1
      `,
      [savedScheduleId],
    );

    for (const entry of schedule) {
      const serviceTypeId = workspace.serviceTypesByCode.get(entry.serviceType);

      if (!serviceTypeId) {
        continue;
      }

      const serviceId = await insertSavedScheduleService(
        client,
        savedScheduleId,
        entry,
        serviceTypeId,
      );

      for (const [role, entryKey] of Object.entries(ROLE_ENTRY_KEYS) as Array<
        [Role, AssignmentEntryKey]
      >) {
        const memberName = entry[entryKey];

        if (typeof memberName !== 'string' || !memberName) {
          continue;
        }

        const memberId = memberIdsByName.get(normalizeName(memberName));

        if (!memberId) {
          continue;
        }

        await insertAssignment(client, serviceId, role, memberId);
      }
    }
  });
}

export async function findSavedSchedule(
  month: number,
  year: number,
  workspace: WorkspaceContext,
) {
  const scheduleMonth = toScheduleMonth(month, year);

  const result = await query<SavedScheduleServiceRow>(
    `
      SELECT
        saved_schedule_services.id AS service_id,
        saved_schedule_services.service_date,
        service_types.name AS service_type_name,
        saved_schedule_services.notes,
        saved_schedule_assignments.role_name,
        members.name AS member_name
      FROM saved_schedules
      INNER JOIN saved_schedule_services
        ON saved_schedule_services.saved_schedule_id = saved_schedules.id
      INNER JOIN service_types
        ON service_types.id = saved_schedule_services.service_type_id
      LEFT JOIN saved_schedule_assignments
        ON saved_schedule_assignments.saved_schedule_service_id = saved_schedule_services.id
      LEFT JOIN members
        ON members.id = saved_schedule_assignments.member_id
      WHERE saved_schedules.ministry_id = $1
        AND saved_schedules.schedule_month = $2
      ORDER BY saved_schedule_services.service_date ASC,
        service_types.sort_order ASC,
        saved_schedule_assignments.slot_index ASC
    `,
    [workspace.ministryId, scheduleMonth],
  );

  const entriesByServiceId = new Map<string, ScheduleEntry>();

  for (const row of result.rows) {
    const serviceType = getServiceTypeCodeByName(row.service_type_name);

    if (!serviceType) {
      continue;
    }

    const serviceId = row.service_id;
    const existingEntry = entriesByServiceId.get(serviceId);
    const entry =
      existingEntry ??
      ({
        date: toDateString(row.service_date),
        serviceType,
        serviceLabel: SERVICE_LABELS[serviceType],
        minister: null,
        apoio: null,
        violao: null,
        guitarra: null,
        teclado: null,
        baixo: null,
        bateria: null,
        notes: row.notes,
      } satisfies ScheduleEntry);

    if (row.role_name && row.member_name) {
      const entryKey = ROLE_ENTRY_KEYS[row.role_name as Role];

      if (entryKey) {
        entry[entryKey] = row.member_name;
      }
    }

    entriesByServiceId.set(serviceId, entry);
  }

  return [...entriesByServiceId.values()];
}
