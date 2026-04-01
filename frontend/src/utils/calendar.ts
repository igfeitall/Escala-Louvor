import type { ServiceSlot } from '../types';

function capitalizeFirstLetter(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toIsoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function createServiceKey(service: Pick<ServiceSlot, 'date' | 'serviceType'>) {
  return `${service.date}|${service.serviceType}`;
}

export function getMonthLabel(month: number, year: number) {
  return capitalizeFirstLetter(
    new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1)),
  );
}

export function getMonthOptionLabel(month: number, year: number) {
  return capitalizeFirstLetter(
    new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
    }).format(new Date(year, month - 1, 1)),
  );
}

export function getServiceSlots(month: number, year: number): ServiceSlot[] {
  const current = new Date(Date.UTC(year, month - 1, 1));
  const services: ServiceSlot[] = [];

  while (current.getUTCMonth() === month - 1) {
    const dayOfWeek = current.getUTCDay();
    const date = toIsoDate(year, month, current.getUTCDate());

    if (dayOfWeek === 0) {
      services.push({
        date,
        serviceType: 'SUNDAY_MORNING',
        serviceLabel: 'Domingo de manha',
        serviceKey: createServiceKey({ date, serviceType: 'SUNDAY_MORNING' }),
      });
      services.push({
        date,
        serviceType: 'SUNDAY_EVENING',
        serviceLabel: 'Domingo a noite',
        serviceKey: createServiceKey({ date, serviceType: 'SUNDAY_EVENING' }),
      });
    }

    if (dayOfWeek === 3) {
      services.push({
        date,
        serviceType: 'WEDNESDAY',
        serviceLabel: 'Quarta-feira',
        serviceKey: createServiceKey({ date, serviceType: 'WEDNESDAY' }),
      });
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return services;
}

export function formatIsoDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`));
}

export function formatServiceColumnLabel(service: ServiceSlot) {
  switch (service.serviceType) {
    case 'SUNDAY_MORNING':
      return 'Manha';
    case 'SUNDAY_EVENING':
      return 'Noite';
    case 'WEDNESDAY':
      return 'Quarta';
  }
}

export function formatServicePreview(service: ServiceSlot) {
  return `${formatIsoDate(service.date)} - ${service.serviceLabel}`;
}
