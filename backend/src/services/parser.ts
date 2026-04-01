import * as XLSX from 'xlsx';

import { ROLE_OPTIONS, type Role } from '../constants/roles.js';
import type { ParseResult, ParsedRow, ServiceSlot, ServiceType } from '../types/index.js';
import { createServiceKey, enumerateServices } from './dateUtils.js';
import { normalizeName, toTitleCase } from '../utils/normalize.js';

interface MemberLookup {
  id: string;
  name: string;
  normalizedName: string;
}

interface SpreadsheetColumns {
  name: string;
  roles: string;
  unavailability: string;
}

const ROLE_ALIASES: Record<string, Role> = {
  ministro: 'MINISTRO',
  apoio: 'APOIO',
  violao: 'VIOLAO',
  guitarra: 'GUITARRA',
  teclado: 'TECLADO',
  baixo: 'BAIXO',
  bateria: 'BATERIA',
};

const SERVICE_ALIASES: Record<string, ServiceType> = {
  quarta: 'WEDNESDAY',
  'domingo - manha': 'SUNDAY_MORNING',
  'domingo - noite': 'SUNDAY_EVENING',
};

function parseRoleToken(token: string): Role | null {
  const normalized = normalizeName(token);
  return ROLE_ALIASES[normalized] ?? null;
}

function findColumn(headers: string[], predicate: (header: string) => boolean) {
  return headers.find((header) => predicate(normalizeName(header))) ?? null;
}

function resolveColumns(rows: Array<Record<string, unknown>>): SpreadsheetColumns {
  const headers = Object.keys(rows[0] ?? {});

  const name =
    findColumn(headers, (header) => header === 'nome' || header === 'seu nome') ?? 'Nome';
  const roles =
    findColumn(headers, (header) => header === 'funcoes' || header === 'suas funcoes') ??
    'Funcoes';
  const unavailability =
    findColumn(
      headers,
      (header) =>
        header.includes('indisponivel') ||
        header.includes('nao pode') ||
        header.includes('n o pode'),
    ) ?? 'Indisponivel';

  return {
    name,
    roles,
    unavailability,
  };
}

function hasRequiredColumns(columns: SpreadsheetColumns, headers: string[]) {
  return (
    headers.includes(columns.name) &&
    headers.includes(columns.roles) &&
    headers.includes(columns.unavailability)
  );
}

function getDataRows(workbook: XLSX.WorkBook) {
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: '',
    }).filter((row) => Object.values(row).some((value) => String(value).trim() !== ''));

    if (rows.length === 0) {
      continue;
    }

    const columns = resolveColumns(rows);
    const headers = Object.keys(rows[0] ?? {});

    if (hasRequiredColumns(columns, headers)) {
      return { rows, columns };
    }
  }

  return { rows: [] as Array<Record<string, unknown>>, columns: null as SpreadsheetColumns | null };
}

function parseUnavailableServices(
  rawValue: unknown,
  month: number,
  year: number,
  validServices: Map<string, ServiceSlot>,
): ServiceSlot[] {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return [];
  }

  const normalizedValue = normalizeName(rawValue);

  if (normalizedValue === 'estarei em todos') {
    return [];
  }

  const unavailableServices = new Map<string, ServiceSlot>();
  const tokens = rawValue
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  tokens.forEach((token) => {
    const detailedMatch = token.match(/^(\d{1,2})\/(\d{1,2})\s*\(([^)]+)\)$/);

    if (detailedMatch) {
      const day = Number(detailedMatch[1]);
      const parsedMonth = Number(detailedMatch[2]);
      const rawServiceName = detailedMatch[3];

      if (parsedMonth !== month) {
        throw new Error(`Data fora do mes selecionado: ${token}`);
      }

      const normalizedServiceName = normalizeName(rawServiceName);
      const serviceType = SERVICE_ALIASES[normalizedServiceName];

      if (!serviceType) {
        throw new Error(`Culto invalido: ${rawServiceName}`);
      }

      const date = new Date(Date.UTC(year, month - 1, day));

      if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new Error(`Dia invalido: ${token}`);
      }

      const isoDate = date.toISOString().slice(0, 10);
      const serviceKey = createServiceKey(isoDate, serviceType);
      const service = validServices.get(serviceKey);

      if (!service) {
        throw new Error(`Culto inexistente no calendario do mes: ${token}`);
      }

      unavailableServices.set(serviceKey, service);
      return;
    }

    const dateMatch = token.match(/^(\d{1,2})\/(\d{1,2})$/);

    if (!dateMatch) {
      throw new Error(`Disponibilidade invalida: ${token}`);
    }

    const day = Number(dateMatch[1]);
    const parsedMonth = Number(dateMatch[2]);

    if (parsedMonth !== month) {
      throw new Error(`Data fora do mes selecionado: ${token}`);
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new Error(`Dia invalido: ${token}`);
    }

    const isoDate = date.toISOString().slice(0, 10);
    const matchingServices = [...validServices.values()].filter((service) => service.date === isoDate);

    if (matchingServices.length === 0) {
      throw new Error(`Nenhum culto encontrado para ${token}`);
    }

    matchingServices.forEach((service) => {
      unavailableServices.set(service.serviceKey, service);
    });
  });

  return [...unavailableServices.values()].sort((left, right) =>
    left.serviceKey.localeCompare(right.serviceKey),
  );
}

function getCandidateValue(row: Record<string, unknown>, column: string) {
  return row[column];
}

export function parseSpreadsheet(
  buffer: Buffer,
  month: number,
  year: number,
  members: MemberLookup[],
): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const { rows, columns } = getDataRows(workbook);

  if (rows.length === 0 || !columns) {
    return {
      month,
      year,
      parsedRows: [],
      unmatchedMembers: [],
      rowErrors: [{ row: 0, message: 'Nenhuma aba de respostas valida foi encontrada.' }],
    };
  }
  const memberMap = new Map(members.map((member) => [member.normalizedName, member]));
  const validServices = new Map(
    enumerateServices(month, year).map((service) => [service.serviceKey, service]),
  );
  const parsedRows: ParsedRow[] = [];
  const unmatchedMembers = new Set<string>();
  const rowErrors: Array<{ row: number; message: string }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rawName = String(getCandidateValue(row, columns.name) ?? '');
    const rawRoles = String(getCandidateValue(row, columns.roles) ?? '');

    if (!rawName.trim()) {
      rowErrors.push({ row: rowNumber, message: 'Nome ausente.' });
      return;
    }

    if (!rawRoles.trim()) {
      rowErrors.push({ row: rowNumber, message: 'Funcoes ausentes.' });
      return;
    }

    try {
      const name = toTitleCase(rawName);
      const normalizedName = normalizeName(name);
      const roles = rawRoles
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => {
          const parsedRole = parseRoleToken(token);

          if (!parsedRole || !ROLE_OPTIONS.includes(parsedRole)) {
            throw new Error(`Funcao invalida: ${token}`);
          }

          return parsedRole;
        });

      const unavailableServices = parseUnavailableServices(
        getCandidateValue(row, columns.unavailability),
        month,
        year,
        validServices,
      );
      const matchedMember = memberMap.get(normalizedName) ?? null;

      if (!matchedMember) {
        unmatchedMembers.add(name);
      }

      parsedRows.push({
        row: rowNumber,
        name,
        normalizedName,
        roles,
        unavailableServices,
        matchedMember: matchedMember ? { id: matchedMember.id, name: matchedMember.name } : null,
      });
    } catch (error) {
      rowErrors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : 'Erro ao processar linha.',
      });
    }
  });

  return {
    month,
    year,
    parsedRows,
    unmatchedMembers: [...unmatchedMembers].sort((left, right) => left.localeCompare(right)),
    rowErrors,
  };
}
