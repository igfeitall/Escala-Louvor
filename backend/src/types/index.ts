import type { Role } from '../constants/roles.js';

export type ServiceType = 'SUNDAY_MORNING' | 'SUNDAY_EVENING' | 'WEDNESDAY';

export interface ServiceSlot {
  serviceKey: string;
  date: string;
  serviceType: ServiceType;
  serviceLabel: string;
}

export interface MemberRecord {
  id: string;
  name: string;
  roles: Role[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedRow {
  row: number;
  name: string;
  normalizedName: string;
  roles: Role[];
  unavailableServices: ServiceSlot[];
  matchedMember: { id: string; name: string } | null;
}

export interface ParseResult {
  month: number;
  year: number;
  parsedRows: ParsedRow[];
  unmatchedMembers: string[];
  rowErrors: Array<{ row: number; message: string }>;
}

export interface AvailabilityOverride {
  memberId: string;
  unavailableServiceKeys: string[];
}

export interface ScheduleEntry {
  date: string;
  serviceType: ServiceType;
  serviceLabel: string;
  minister: string | null;
  apoio: string | null;
  violao: string | null;
  guitarra: string | null;
  teclado: string | null;
  baixo: string | null;
  bateria: string | null;
  notes: string | null;
}
