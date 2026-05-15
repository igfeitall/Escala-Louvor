import { query } from '../config/database.js';
import { SERVICE_TYPE_ORDER } from '../constants/services.js';
import type { ServiceType } from '../types/index.js';
import { HttpError } from '../utils/http.js';

interface ServiceTypeRow {
  id: string;
  name: string;
  code: ServiceType;
}

interface MinistryRow {
  id: string;
}

// Mapa de nome do service_type → código interno
const SERVICE_NAME_TO_CODE: Record<string, ServiceType> = {
  'Culto Domingo Manhã': 'SUNDAY_MORNING',
  'Domingo de manhã': 'SUNDAY_MORNING',
  'Culto Domingo Noite': 'SUNDAY_EVENING',
  'Domingo à noite': 'SUNDAY_EVENING',
  'Culto Quarta': 'WEDNESDAY',
  'Quarta-feira': 'WEDNESDAY',
};

export interface WorkspaceContext {
  userId: string;
  ministryId: string;
  serviceTypesByCode: Map<ServiceType, string>;
}

/**
 * Resolve o contexto de trabalho (ministério + tipos de culto) para um userId autenticado.
 * Lança 404 se o usuário não tiver ministério cadastrado.
 */
export async function resolveWorkspace(userId: string): Promise<WorkspaceContext> {
  // Busca o primeiro ministério do usuário
  const ministryResult = await query<MinistryRow>(
    `
      SELECT id
      FROM ministries
      WHERE user_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [userId],
  );

  const ministry = ministryResult.rows[0];

  if (!ministry) {
    throw new HttpError(404, 'Nenhum ministério encontrado para este usuário.');
  }

  // Busca os tipos de culto do usuário
  const serviceTypesResult = await query<{ id: string; name: string }>(
    `
      SELECT id, name
      FROM service_types
      WHERE user_id = $1
      ORDER BY sort_order ASC
    `,
    [userId],
  );

  const serviceTypesByCode = new Map<ServiceType, string>();

  for (const row of serviceTypesResult.rows) {
    const code = SERVICE_NAME_TO_CODE[row.name];
    if (code) {
      serviceTypesByCode.set(code, row.id);
    }
  }

  return {
    userId,
    ministryId: ministry.id,
    serviceTypesByCode,
  };
}

export function getServiceTypeCodeByName(name: string): ServiceType | null {
  return SERVICE_NAME_TO_CODE[name] ?? null;
}

export function isValidServiceType(value: string): value is ServiceType {
  return SERVICE_TYPE_ORDER.includes(value as ServiceType);
}
