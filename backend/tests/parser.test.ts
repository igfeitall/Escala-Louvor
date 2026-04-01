import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';

import { parseSpreadsheet } from '../src/services/parser.js';

function workbookBuffer(rows: Array<Record<string, string>>, extraSheetRows?: Array<Record<string, string>>) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas ao formulario 1');

  if (extraSheetRows) {
    const extraWorksheet = XLSX.utils.json_to_sheet(extraSheetRows);
    XLSX.utils.book_append_sheet(workbook, extraWorksheet, 'Pagina1');
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

describe('parseSpreadsheet', () => {
  it('parses the google forms format with service-specific unavailability', () => {
    const buffer = workbookBuffer([
      {
        'Seu nome': 'joao silva',
        'Suas Funções': 'Teclado, Apoio',
        '  Quais datas você NÃO pode?  ': '05/04 (Domingo - manhã), 12/04 (Domingo - noite)',
      },
    ]);

    const result = parseSpreadsheet(buffer, 4, 2026, [
      { id: '1', name: 'Joao Silva', normalizedName: 'joao silva' },
    ]);

    expect(result.rowErrors).toHaveLength(0);
    expect(result.unmatchedMembers).toEqual([]);
    expect(result.parsedRows[0]?.matchedMember).toEqual({ id: '1', name: 'Joao Silva' });
    expect(result.parsedRows[0]?.unavailableServices.map((service) => service.serviceKey)).toEqual([
      '2026-04-05|SUNDAY_MORNING',
      '2026-04-12|SUNDAY_EVENING',
    ]);
  });

  it('ignores non-response sheets and keeps unmatched members', () => {
    const buffer = workbookBuffer(
      [
        {
          'Seu nome': 'Pedro',
          'Suas Funções': 'Ministro',
          '  Quais datas você NÃO pode?  ': 'Estarei em Todos',
        },
      ],
      [
        {
          Data: '05/04',
          Culto: 'Domingo Manha',
        },
      ],
    );

    const result = parseSpreadsheet(buffer, 4, 2026, []);

    expect(result.rowErrors).toHaveLength(0);
    expect(result.unmatchedMembers).toEqual(['Pedro']);
    expect(result.parsedRows[0]?.unavailableServices).toEqual([]);
  });
});
