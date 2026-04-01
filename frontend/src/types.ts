export const ROLE_OPTIONS = [
  'MINISTRO',
  'APOIO',
  'VIOLAO',
  'GUITARRA',
  'TECLADO',
  'BAIXO',
  'BATERIA',
] as const;

export type Role = (typeof ROLE_OPTIONS)[number];

export interface Member {
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
  unavailableDates: string[];
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
  unavailableDates: string[];
}

export interface ScheduleEntry {
  date: string;
  serviceType: 'SUNDAY_MORNING' | 'SUNDAY_EVENING' | 'WEDNESDAY';
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
