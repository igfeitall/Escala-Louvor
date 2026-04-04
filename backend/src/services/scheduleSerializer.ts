import type { ScheduleDocument } from '../models/Schedule.js';
import type { ScheduleEntry } from '../types/index.js';

export interface ScheduleRecord {
  month: number;
  year: number;
  schedule: ScheduleEntry[];
  createdAt: string;
  updatedAt: string;
}

export function toScheduleRecord(schedule: ScheduleDocument): ScheduleRecord {
  return {
    month: schedule.month,
    year: schedule.year,
    schedule: schedule.schedule,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  };
}
