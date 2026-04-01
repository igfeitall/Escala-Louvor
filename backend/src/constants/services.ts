import type { ServiceType } from '../types/index.js';

export const SERVICE_TYPE_ORDER: ServiceType[] = [
  'SUNDAY_MORNING',
  'SUNDAY_EVENING',
  'WEDNESDAY',
];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  SUNDAY_MORNING: 'Domingo de manhã',
  SUNDAY_EVENING: 'Domingo à noite',
  WEDNESDAY: 'Quarta-feira',
};
