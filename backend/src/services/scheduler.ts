import { SCHEDULING_ROLE_ORDER, type Role } from '../constants/roles.js';
import {
  createEmptyScheduleEntry,
  createServiceKey,
  enumerateServices,
  getWeekKey,
} from './dateUtils.js';
import type { AvailabilityOverride, MemberRecord, ScheduleEntry } from '../types/index.js';

interface SchedulingState {
  assignmentsByMember: Map<string, number>;
  lastAssignmentByMember: Map<string, number>;
  recentAssignmentsByMember: Map<string, number[]>;
  weekAssignmentsByMember: Map<string, Record<string, number>>;
}

type AssignmentKey =
  | 'minister'
  | 'apoio'
  | 'violao'
  | 'guitarra'
  | 'teclado'
  | 'baixo'
  | 'bateria';

function getRolePriorityBonus(member: MemberRecord, role: Role) {
  const index = member.roles.indexOf(role);

  if (index === -1) {
    return Number.NEGATIVE_INFINITY;
  }

  return Math.max(40 - index * 10, 10);
}

function getUnavailableSet(overrides: AvailabilityOverride[]) {
  const map = new Map<string, Set<string>>();

  overrides.forEach((override) => {
    map.set(override.memberId, new Set(override.unavailableServiceKeys));
  });

  return map;
}

function getScore(
  member: MemberRecord,
  role: Role,
  serviceIndex: number,
  weekKey: string,
  state: SchedulingState,
) {
  const recentAssignments = state.recentAssignmentsByMember.get(member.id) ?? [];
  const recentPenalty = recentAssignments.filter((value) => serviceIndex - value <= 2).length * 15;
  const totalAssignments = state.assignmentsByMember.get(member.id) ?? 0;
  const sameWeekAssignments = state.weekAssignmentsByMember.get(member.id)?.[weekKey] ?? 0;

  return 100 + getRolePriorityBonus(member, role) - recentPenalty - totalAssignments * 5 - sameWeekAssignments * 20;
}

function roleToEntryKey(role: Role): AssignmentKey {
  switch (role) {
    case 'MINISTRO':
      return 'minister';
    case 'APOIO':
      return 'apoio';
    case 'VIOLAO':
      return 'violao';
    case 'GUITARRA':
      return 'guitarra';
    case 'TECLADO':
      return 'teclado';
    case 'BAIXO':
      return 'baixo';
    case 'BATERIA':
      return 'bateria';
  }
}

function updateState(state: SchedulingState, memberId: string, serviceIndex: number, weekKey: string) {
  state.assignmentsByMember.set(memberId, (state.assignmentsByMember.get(memberId) ?? 0) + 1);
  state.lastAssignmentByMember.set(memberId, serviceIndex);

  const recentAssignments = state.recentAssignmentsByMember.get(memberId) ?? [];
  recentAssignments.push(serviceIndex);
  state.recentAssignmentsByMember.set(memberId, recentAssignments.slice(-4));

  const weekAssignments = state.weekAssignmentsByMember.get(memberId) ?? {};
  weekAssignments[weekKey] = (weekAssignments[weekKey] ?? 0) + 1;
  state.weekAssignmentsByMember.set(memberId, weekAssignments);
}

export function generateSchedule(
  members: MemberRecord[],
  overrides: AvailabilityOverride[],
  month: number,
  year: number,
): ScheduleEntry[] {
  const services = enumerateServices(month, year);
  const unavailableMap = getUnavailableSet(overrides);
  const state: SchedulingState = {
    assignmentsByMember: new Map(),
    lastAssignmentByMember: new Map(),
    recentAssignmentsByMember: new Map(),
    weekAssignmentsByMember: new Map(),
  };

  return services.map((service, serviceIndex) => {
    const entry = createEmptyScheduleEntry(service);
    const assignedMemberIds = new Set<string>();
    const weekKey = getWeekKey(service.date);

    SCHEDULING_ROLE_ORDER.forEach((role) => {
      const candidates = members
        .filter((member) => member.roles.includes(role))
        .filter((member) => !assignedMemberIds.has(member.id))
        .filter(
          (member) =>
            !unavailableMap
              .get(member.id)
              ?.has(createServiceKey(service.date, service.serviceType)),
        )
        .map((member) => ({
          member,
          score: getScore(member, role, serviceIndex, weekKey, state),
          totalAssignments: state.assignmentsByMember.get(member.id) ?? 0,
          lastAssignment: state.lastAssignmentByMember.get(member.id),
        }))
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }

          if (left.totalAssignments !== right.totalAssignments) {
            return left.totalAssignments - right.totalAssignments;
          }

          const leftLast = left.lastAssignment ?? Number.MIN_SAFE_INTEGER;
          const rightLast = right.lastAssignment ?? Number.MIN_SAFE_INTEGER;

          if (leftLast !== rightLast) {
            return leftLast - rightLast;
          }

          return left.member.name.localeCompare(right.member.name);
        });

      const selected = candidates[0]?.member;

      if (!selected) {
        return;
      }

      entry[roleToEntryKey(role)] = selected.name;
      assignedMemberIds.add(selected.id);
      updateState(state, selected.id, serviceIndex, weekKey);
    });

    const hasMinister = Boolean(entry.minister);
    const hasHarmonic = Boolean(entry.violao || entry.teclado);

    if (!hasMinister || !hasHarmonic) {
      const missing = [];

      if (!hasMinister) {
        missing.push('sem ministro');
      }

      if (!hasHarmonic) {
        missing.push('sem harmonia');
      }

      entry.notes = `Formação incompleta: ${missing.join(', ')}.`;
    }

    return entry;
  });
}
