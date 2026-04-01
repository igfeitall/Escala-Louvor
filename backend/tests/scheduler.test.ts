import { describe, expect, it } from 'vitest';

import { generateSchedule } from '../src/services/scheduler.js';
import type { AvailabilityOverride, MemberRecord } from '../src/types/index.js';

const baseDate = new Date('2026-01-01T00:00:00.000Z').toISOString();

function buildMember(id: string, name: string, roles: MemberRecord['roles']): MemberRecord {
  return {
    id,
    name,
    roles,
    createdAt: baseDate,
    updatedAt: baseDate,
  };
}

describe('generateSchedule', () => {
  it('fills separate role slots and never repeats a member in the same service', () => {
    const members = [
      buildMember('1', 'Ana', ['MINISTRO']),
      buildMember('2', 'Bruno', ['VIOLAO']),
      buildMember('3', 'Carla', ['TECLADO']),
      buildMember('4', 'Diego', ['BAIXO']),
      buildMember('5', 'Eva', ['BATERIA']),
      buildMember('6', 'Fabio', ['GUITARRA']),
      buildMember('7', 'Gabi', ['APOIO']),
    ];

    const schedule = generateSchedule(members, [], 4, 2026);
    const firstService = schedule[0];
    const assigned = [
      firstService?.minister,
      firstService?.violao,
      firstService?.teclado,
      firstService?.baixo,
      firstService?.bateria,
      firstService?.guitarra,
      firstService?.apoio,
    ].filter(Boolean);

    expect(schedule.length).toBeGreaterThan(0);
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it('marks incomplete formation when minister or harmonic roles are missing', () => {
    const members = [buildMember('1', 'Ana', ['APOIO'])];
    const schedule = generateSchedule(members, [], 4, 2026);

    expect(schedule[0]?.notes).toContain('Formação incompleta');
  });

  it('respects unavailable members', () => {
    const members = [
      buildMember('1', 'Ana', ['MINISTRO']),
      buildMember('2', 'Beto', ['MINISTRO']),
      buildMember('3', 'Caio', ['VIOLAO']),
    ];

    const overrides: AvailabilityOverride[] = [
      {
        memberId: '1',
        unavailableDates: ['2026-04-05'],
      },
    ];

    const schedule = generateSchedule(members, overrides, 4, 2026);
    const firstService = schedule.find(
      (entry) => entry.date === '2026-04-05' && entry.serviceType === 'SUNDAY_MORNING',
    );

    expect(firstService?.minister).toBe('Beto');
  });
});
