import type { ScheduleEntry } from '../types/index.js';

function escapeCsv(value: string | null) {
  if (!value) {
    return '';
  }

  return `"${value.replaceAll('"', '""')}"`;
}

export function buildScheduleCsv(schedule: ScheduleEntry[]) {
  const header = [
    'Data',
    'Culto',
    'Ministro',
    'Apoio',
    'Violão',
    'Guitarra',
    'Teclado',
    'Baixo',
    'Bateria',
    'Observações',
  ];

  const rows = schedule.map((entry) =>
    [
      entry.date,
      entry.serviceLabel,
      entry.minister,
      entry.apoio,
      entry.violao,
      entry.guitarra,
      entry.teclado,
      entry.baixo,
      entry.bateria,
      entry.notes,
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [header.join(','), ...rows].join('\n');
}
