import { SERVICE_LABELS } from '../constants/services.js';
import type { ScheduleEntry, ServiceSlot, ServiceType } from '../types/index.js';

type ServiceDefinition = ServiceSlot;

function toIsoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function createServiceKey(date: string, serviceType: ServiceType) {
  return `${date}|${serviceType}`;
}

export function enumerateServices(month: number, year: number): ServiceDefinition[] {
  const current = new Date(Date.UTC(year, month - 1, 1));
  const services: ServiceDefinition[] = [];

  while (current.getUTCMonth() === month - 1) {
    const dayOfWeek = current.getUTCDay();
    const date = toIsoDate(year, month, current.getUTCDate());

    if (dayOfWeek === 0) {
      services.push({
        date,
        serviceType: 'SUNDAY_MORNING',
        serviceLabel: SERVICE_LABELS.SUNDAY_MORNING,
        serviceKey: createServiceKey(date, 'SUNDAY_MORNING'),
      });
      services.push({
        date,
        serviceType: 'SUNDAY_EVENING',
        serviceLabel: SERVICE_LABELS.SUNDAY_EVENING,
        serviceKey: createServiceKey(date, 'SUNDAY_EVENING'),
      });
    }

    if (dayOfWeek === 3) {
      services.push({
        date,
        serviceType: 'WEDNESDAY',
        serviceLabel: SERVICE_LABELS.WEDNESDAY,
        serviceKey: createServiceKey(date, 'WEDNESDAY'),
      });
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return services;
}

export function getWeekKey(date: string) {
  const current = new Date(`${date}T00:00:00Z`);
  const firstDay = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const dayOffset = Math.floor((current.getTime() - firstDay.getTime()) / 86_400_000);
  const week = Math.floor((dayOffset + firstDay.getUTCDay()) / 7) + 1;
  return `${current.getUTCFullYear()}-${week}`;
}

export function createEmptyScheduleEntry(service: ServiceDefinition): ScheduleEntry {
  return {
    date: service.date,
    serviceType: service.serviceType,
    serviceLabel: service.serviceLabel,
    minister: null,
    apoio: null,
    violao: null,
    guitarra: null,
    teclado: null,
    baixo: null,
    bateria: null,
    notes: null,
  };
}
