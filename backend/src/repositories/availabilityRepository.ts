import type { PoolClient } from 'pg';

import { query, withTransaction } from '../config/database.js';
import type { AvailabilityOverride, ServiceType } from '../types/index.js';
import {
  getServiceTypeCodeByName,
  isValidServiceType,
  type WorkspaceContext,
} from './workspaceRepository.js';

interface AvailabilityRow {
  member_id: string;
  service_date: Date | string;
  service_type_name: string;
}

interface ParsedServiceKey {
  serviceDate: string;
  serviceType: ServiceType;
}

function toScheduleMonth(month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function toDateString(value: Date | string) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function parseServiceKey(serviceKey: string): ParsedServiceKey | null {
  const [serviceDate, serviceType] = serviceKey.split('|');

  if (!serviceDate || !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
    return null;
  }

  if (!serviceType || !isValidServiceType(serviceType)) {
    return null;
  }

  return { serviceDate, serviceType };
}

async function insertAvailability(
  client: PoolClient,
  memberId: string,
  scheduleMonth: string,
  serviceDate: string,
  serviceTypeId: string,
) {
  await client.query(
    `
      INSERT INTO member_monthly_unavailabilities (
        member_id,
        schedule_month,
        service_date,
        service_type_id
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (member_id, service_date, service_type_id) DO NOTHING
    `,
    [memberId, scheduleMonth, serviceDate, serviceTypeId],
  );
}

export async function findAvailability(
  month: number,
  year: number,
  workspace: WorkspaceContext,
) {
  const scheduleMonth = toScheduleMonth(month, year);

  const result = await query<AvailabilityRow>(
    `
      SELECT
        availability.member_id,
        availability.service_date,
        service_types.name AS service_type_name
      FROM member_monthly_unavailabilities availability
      INNER JOIN members ON members.id = availability.member_id
      INNER JOIN service_types ON service_types.id = availability.service_type_id
      WHERE members.ministry_id = $1
        AND availability.schedule_month = $2
      ORDER BY availability.member_id ASC, availability.service_date ASC, service_types.sort_order ASC
    `,
    [workspace.ministryId, scheduleMonth],
  );

  const overridesByMember = new Map<string, Set<string>>();

  for (const row of result.rows) {
    const serviceType = getServiceTypeCodeByName(row.service_type_name);

    if (!serviceType) {
      continue;
    }

    const serviceDate = toDateString(row.service_date);
    const serviceKeys = overridesByMember.get(row.member_id) ?? new Set<string>();
    serviceKeys.add(`${serviceDate}|${serviceType}`);
    overridesByMember.set(row.member_id, serviceKeys);
  }

  return [...overridesByMember.entries()]
    .map(([memberId, unavailableServiceKeys]) => ({
      memberId,
      unavailableServiceKeys: [...unavailableServiceKeys].sort(),
    }))
    .sort((left, right) => left.memberId.localeCompare(right.memberId));
}

export async function replaceAvailability(
  month: number,
  year: number,
  overrides: AvailabilityOverride[],
  workspace: WorkspaceContext,
) {
  const scheduleMonth = toScheduleMonth(month, year);

  await withTransaction(async (client) => {
    await client.query(
      `
        DELETE FROM member_monthly_unavailabilities availability
        USING members
        WHERE members.id = availability.member_id
          AND members.ministry_id = $1
          AND availability.schedule_month = $2
      `,
      [workspace.ministryId, scheduleMonth],
    );

    for (const override of overrides) {
      for (const serviceKey of override.unavailableServiceKeys) {
        const parsedServiceKey = parseServiceKey(serviceKey);

        if (!parsedServiceKey) {
          continue;
        }

        const serviceTypeId = workspace.serviceTypesByCode.get(parsedServiceKey.serviceType);

        if (!serviceTypeId) {
          continue;
        }

        await insertAvailability(
          client,
          override.memberId,
          scheduleMonth,
          parsedServiceKey.serviceDate,
          serviceTypeId,
        );
      }
    }
  });
}
