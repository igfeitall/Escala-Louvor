import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';

import { parseSpreadsheet } from '../src/services/parser.js';

function workbookBuffer(rows: Array<Record<string, string>>) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

describe('parseSpreadsheet', () => {
  it('parses valid rows and matches members', () => {
    const buffer = workbookBuffer([
      {
        Nome: 'joão silva',
        Funcoes: 'Teclado, Apoio',
        Indisponivel: '06/04, 13/04',
      },
    ]);

    const result = parseSpreadsheet(buffer, 4, 2026, [
      { id: '1', name: 'João Silva', normalizedName: 'joao silva' },
    ]);

    expect(result.rowErrors).toHaveLength(0);
    expect(result.unmatchedMembers).toEqual([]);
    expect(result.parsedRows[0]?.matchedMember).toEqual({ id: '1', name: 'João Silva' });
    expect(result.parsedRows[0]?.unavailableDates).toEqual(['2026-04-06', '2026-04-13']);
  });

  it('reports invalid rows and unmatched members', () => {
    const buffer = workbookBuffer([
      {
        Nome: 'Maria',
        Funcoes: 'Função Desconhecida',
        Indisponivel: '',
      },
      {
        Nome: 'Pedro',
        Funcoes: 'Ministro',
        Indisponivel: '',
      },
    ]);

    const result = parseSpreadsheet(buffer, 4, 2026, []);

    expect(result.rowErrors).toHaveLength(1);
    expect(result.unmatchedMembers).toEqual(['Pedro']);
  });
});
