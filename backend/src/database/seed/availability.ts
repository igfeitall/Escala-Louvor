import { type PoolClient } from 'pg';

import { IDS } from './constants.js';

/**
 * Mapa de nome do membro → member_id.
 * Usado para resolver as indisponibilidades pelo nome.
 */
const MEMBER_ID_BY_NAME: Record<string, string> = {
  Roberto:  IDS.MEMBER_ROBERTO,
  Thaisa:   IDS.MEMBER_THAISA,
  Thayna:   IDS.MEMBER_THAYNA,
  Gabriel:  IDS.MEMBER_GABRIEL,
  Thuã:     IDS.MEMBER_THUA,
  Bárbara:  IDS.MEMBER_BARBARA,
  Thamirys: IDS.MEMBER_THAMIRYS,
  Igor:     IDS.MEMBER_IGOR,
  Lígia:    IDS.MEMBER_LIGIA,
  Benjamin: IDS.MEMBER_BENJAMIN,
  Mateus:   IDS.MEMBER_MATEUS,
  Yan:      IDS.MEMBER_YAN,
  Maria:    IDS.MEMBER_MARIA,
  Pablo:    IDS.MEMBER_PABLO,
  Davi:     IDS.MEMBER_DAVI,
  Samuel:   IDS.MEMBER_SAMUEL,
};

/**
 * Mapa de label do culto → service_type_id.
 * Domingo manhã  → SERVICE_SUNDAY_MORNING
 * Domingo noite  → SERVICE_SUNDAY_NIGHT
 * Quarta         → SERVICE_WEDNESDAY
 */
const SERVICE_TYPE_BY_LABEL: Record<string, string> = {
  'Domingo - manhã': IDS.SERVICE_SUNDAY_MORNING,
  'Domingo - noite': IDS.SERVICE_SUNDAY_NIGHT,
  Quarta:            IDS.SERVICE_WEDNESDAY,
};

/**
 * Indisponibilidades de abril/2025.
 * Formato: [nome, 'DD/MM (label)']
 */
const RAW_UNAVAILABILITIES: [string, string][] = [
  ['Thaisa',   '26/04 (Domingo - manhã)'],
  ['Thaisa',   '26/04 (Domingo - noite)'],
  ['Thayna',   '19/04 (Domingo - manhã)'],
  ['Gabriel',  '01/04 (Quarta)'],
  ['Gabriel',  '05/04 (Domingo - manhã)'],
  ['Gabriel',  '08/04 (Quarta)'],
  ['Gabriel',  '12/04 (Domingo - noite)'],
  ['Gabriel',  '15/04 (Quarta)'],
  ['Gabriel',  '19/04 (Domingo - manhã)'],
  ['Gabriel',  '22/04 (Quarta)'],
  ['Gabriel',  '26/04 (Domingo - manhã)'],
  ['Gabriel',  '29/04 (Quarta)'],
  ['Thuã',     '01/04 (Quarta)'],
  ['Thuã',     '05/04 (Domingo - manhã)'],
  ['Thuã',     '08/04 (Quarta)'],
  ['Thuã',     '12/04 (Domingo - manhã)'],
  ['Thuã',     '12/04 (Domingo - noite)'],
  ['Thuã',     '19/04 (Domingo - manhã)'],
  ['Thuã',     '19/04 (Domingo - noite)'],
  ['Thuã',     '26/04 (Domingo - noite)'],
  ['Thuã',     '29/04 (Quarta)'],
  ['Bárbara',  '19/04 (Domingo - noite)'],
  ['Bárbara',  '26/04 (Domingo - noite)'],
  ['Thamirys', '05/04 (Domingo - manhã)'],
  ['Thamirys', '19/04 (Domingo - manhã)'],
  ['Thamirys', '19/04 (Domingo - noite)'],
  ['Thamirys', '22/04 (Quarta)'],
  ['Igor',     '05/04 (Domingo - manhã)'],
  ['Igor',     '19/04 (Domingo - manhã)'],
  ['Igor',     '19/04 (Domingo - noite)'],
  ['Igor',     '22/04 (Quarta)'],
  ['Mateus',   '05/04 (Domingo - manhã)'],
  ['Mateus',   '12/04 (Domingo - manhã)'],
  ['Mateus',   '12/04 (Domingo - noite)'],
  ['Mateus',   '19/04 (Domingo - manhã)'],
  ['Mateus',   '19/04 (Domingo - noite)'],
  ['Yan',      '01/04 (Quarta)'],
  ['Yan',      '08/04 (Quarta)'],
  ['Yan',      '15/04 (Quarta)'],
  ['Yan',      '22/04 (Quarta)'],
  ['Yan',      '29/04 (Quarta)'],
  ['Maria',    '05/04 (Domingo - noite)'],
  ['Maria',    '12/04 (Domingo - noite)'],
  ['Pablo',    '01/04 (Quarta)'],
  ['Pablo',    '08/04 (Quarta)'],
  ['Pablo',    '15/04 (Quarta)'],
  ['Pablo',    '22/04 (Quarta)'],
  ['Pablo',    '29/04 (Quarta)'],
  ['Davi',     '05/04 (Domingo - noite)'],
  ['Davi',     '19/04 (Domingo - manhã)'],
  ['Davi',     '26/04 (Domingo - noite)'],
];

/**
 * Parseia uma entrada no formato "DD/MM (label)" e retorna
 * { serviceDate, scheduleMonth, serviceTypeId }.
 */
function parseEntry(raw: string, year = 2025): {
  serviceDate: string;
  scheduleMonth: string;
  serviceTypeId: string;
} {
  // ex: "26/04 (Domingo - manhã)"
  const match = raw.match(/^(\d{2})\/(\d{2})\s+\((.+)\)$/);
  if (!match) throw new Error(`Formato inválido de disponibilidade: "${raw}"`);

  const [, day, month, label] = match;
  const serviceTypeId = SERVICE_TYPE_BY_LABEL[label];

  if (!serviceTypeId) {
    throw new Error(`Label de culto desconhecido: "${label}"`);
  }

  const serviceDate   = `${year}-${month}-${day}`;          // 2025-04-26
  const scheduleMonth = `${year}-${month}-01`;              // 2025-04-01

  return { serviceDate, scheduleMonth, serviceTypeId };
}

export async function seedAvailability(client: PoolClient): Promise<void> {
  console.log('  📆 Seeding member availability...');

  let count = 0;

  for (const [memberName, rawDate] of RAW_UNAVAILABILITIES) {
    const memberId = MEMBER_ID_BY_NAME[memberName];
    if (!memberId) {
      console.warn(`    ⚠️  Membro não encontrado: "${memberName}" — pulando`);
      continue;
    }

    const { serviceDate, scheduleMonth, serviceTypeId } = parseEntry(rawDate);

    await client.query(
      `
      INSERT INTO member_monthly_unavailabilities (
        member_id,
        schedule_month,
        service_date,
        service_type_id
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (member_id, service_date, service_type_id) DO NOTHING
      `,
      [memberId, scheduleMonth, serviceDate, serviceTypeId],
    );

    count++;
  }

  console.log(`  ✅ Availability seeded (${count} records)`);
}
