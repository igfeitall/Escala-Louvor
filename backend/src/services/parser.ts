import * as XLSX from 'xlsx';

import { ROLE_OPTIONS, type Role } from '../constants/roles.js';
import type { ParseResult, ParsedRow } from '../types/index.js';
import { normalizeName, toTitleCase } from '../utils/normalize.js';

interface MemberLookup {
  id: string;
  name: string;
  normalizedName: string;
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

function parseRoleToken(token: string): Role | null {
  const normalized = normalizeName(token);
  return ROLE_ALIASES[normalized] ?? null;
}

function parseUnavailableDates(rawValue: unknown, month: number, year: number): string[] {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return [];
  }

  return rawValue
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d{1,2})\/(\d{1,2})$/);

      if (!match) {
        throw new Error(`Data inválida: ${part}`);
      }

      const day = Number(match[1]);
      const parsedMonth = Number(match[2]);

      if (parsedMonth !== month) {
        throw new Error(`Data fora do mês selecionado: ${part}`);
      }

      const date = new Date(Date.UTC(year, month - 1, day));

      if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new Error(`Dia inválido: ${part}`);
      }

      return date.toISOString().slice(0, 10);
    });
}

export function parseSpreadsheet(buffer: Buffer, month: number, year: number, members: MemberLookup[]): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return {
      month,
      year,
      parsedRows: [],
      unmatchedMembers: [],
      rowErrors: [{ row: 0, message: 'Arquivo vazio.' }],
    };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });
  const memberMap = new Map(members.map((member) => [member.normalizedName, member]));
  const parsedRows: ParsedRow[] = [];
  const unmatchedMembers = new Set<string>();
  const rowErrors: Array<{ row: number; message: string }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rawName = typeof row.Nome === 'string' ? row.Nome : '';
    const rawRoles = typeof row.Funcoes === 'string' ? row.Funcoes : '';

    if (!rawName.trim()) {
      rowErrors.push({ row: rowNumber, message: 'Nome ausente.' });
      return;
    }

    if (!rawRoles.trim()) {
      rowErrors.push({ row: rowNumber, message: 'Funções ausentes.' });
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
            throw new Error(`Função inválida: ${token}`);
          }

          return parsedRole;
        });

      const unavailableDates = parseUnavailableDates(row.Indisponivel, month, year);
      const matchedMember = memberMap.get(normalizedName) ?? null;

      if (!matchedMember) {
        unmatchedMembers.add(name);
      }

      parsedRows.push({
        row: rowNumber,
        name,
        normalizedName,
        roles,
        unavailableDates,
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
