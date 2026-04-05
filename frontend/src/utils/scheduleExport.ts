import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { ScheduleEntry } from '../types';
import { formatIsoDate, getMonthLabel } from './calendar';

function getScheduleFilename(month: number, year: number, extension: 'pdf' | 'csv') {
  return `escala-louvor-${year}-${String(month).padStart(2, '0')}.${extension}`;
}

function toDisplayValue(value: string | null) {
  return value ?? '-';
}

export function exportSchedulePdf(schedule: ScheduleEntry[], month: number, year: number) {
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const monthLabel = getMonthLabel(month, year);

  document.setFontSize(16);
  document.text(`Escala de Louvor - ${monthLabel}`, 14, 14);

  autoTable(document, {
    startY: 20,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [46, 92, 71] },
    head: [
      [
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
      ],
    ],
    body: schedule.map((entry) => [
      formatIsoDate(entry.date),
      entry.serviceLabel,
      toDisplayValue(entry.minister),
      toDisplayValue(entry.apoio),
      toDisplayValue(entry.violao),
      toDisplayValue(entry.guitarra),
      toDisplayValue(entry.teclado),
      toDisplayValue(entry.baixo),
      toDisplayValue(entry.bateria),
      toDisplayValue(entry.notes),
    ]),
  });

  document.save(getScheduleFilename(month, year, 'pdf'));
}

export function createScheduleWhatsAppMessage(
  schedule: ScheduleEntry[],
  month: number,
  year: number,
) {
  const monthLabel = getMonthLabel(month, year);
  const header = [`*Escala de Louvor - ${monthLabel}*`, '', 'Segue a escala do mês:'];
  const rows = schedule.map((entry) => {
    const assignments = [
      `Ministro: ${toDisplayValue(entry.minister)}`,
      `Apoio: ${toDisplayValue(entry.apoio)}`,
      `Violão: ${toDisplayValue(entry.violao)}`,
      `Guitarra: ${toDisplayValue(entry.guitarra)}`,
      `Teclado: ${toDisplayValue(entry.teclado)}`,
      `Baixo: ${toDisplayValue(entry.baixo)}`,
      `Bateria: ${toDisplayValue(entry.bateria)}`,
    ].join(' | ');

    const notes = entry.notes ? ` | Obs: ${entry.notes}` : '';
    return `- ${formatIsoDate(entry.date)} (${entry.serviceLabel}) -> ${assignments}${notes}`;
  });

  return [...header, ...rows, '', `Arquivo PDF: ${getScheduleFilename(month, year, 'pdf')}`].join(
    '\n',
  );
}

