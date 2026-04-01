import type {
  AvailabilityOverride,
  AvailabilitySnapshot,
  Member,
  ParseResult,
  ScheduleEntry,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Erro inesperado na API.');
  }

  return (await response.json()) as T;
}

export async function fetchMembers() {
  const response = await fetch(`${API_BASE_URL}/members`);
  return parseJson<Member[]>(response);
}

export async function createMember(input: Pick<Member, 'name' | 'roles' | 'notes'>) {
  const response = await fetch(`${API_BASE_URL}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJson<Member>(response);
}

export async function updateMember(id: string, input: Pick<Member, 'name' | 'roles' | 'notes'>) {
  const response = await fetch(`${API_BASE_URL}/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJson<Member>(response);
}

export async function deleteMember(id: string) {
  const response = await fetch(`${API_BASE_URL}/members/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Nao foi possivel excluir o membro.');
  }
}

export async function fetchAvailability(month: number, year: number) {
  const response = await fetch(`${API_BASE_URL}/availability?month=${month}&year=${year}`);
  return parseJson<AvailabilitySnapshot>(response);
}

export async function saveAvailability(
  month: number,
  year: number,
  overrides: AvailabilityOverride[],
) {
  const response = await fetch(`${API_BASE_URL}/availability?month=${month}&year=${year}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  });

  return parseJson<AvailabilitySnapshot>(response);
}

export async function parseSpreadsheet(file: File, month: number, year: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', String(month));
  formData.append('year', String(year));

  const response = await fetch(`${API_BASE_URL}/schedule/parse`, {
    method: 'POST',
    body: formData,
  });

  return parseJson<ParseResult>(response);
}

export async function generateSchedule(
  month: number,
  year: number,
  overrides: AvailabilityOverride[],
) {
  const response = await fetch(`${API_BASE_URL}/schedule/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, year, overrides }),
  });

  return parseJson<{ month: number; year: number; schedule: ScheduleEntry[] }>(response);
}

export async function exportScheduleCsv(schedule: ScheduleEntry[]) {
  const response = await fetch(`${API_BASE_URL}/schedule/export-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedule }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Nao foi possivel exportar a escala.');
  }

  return response.text();
}
