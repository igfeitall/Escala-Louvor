import { Schema, model } from 'mongoose';

import type { ScheduleEntry } from '../types/index.js';

const scheduleEntrySchema = new Schema<ScheduleEntry>(
  {
    date: {
      type: String,
      required: true,
      trim: true,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
    },
    serviceLabel: {
      type: String,
      required: true,
      trim: true,
    },
    minister: {
      type: String,
      default: null,
      trim: true,
    },
    apoio: {
      type: String,
      default: null,
      trim: true,
    },
    violao: {
      type: String,
      default: null,
      trim: true,
    },
    guitarra: {
      type: String,
      default: null,
      trim: true,
    },
    teclado: {
      type: String,
      default: null,
      trim: true,
    },
    baixo: {
      type: String,
      default: null,
      trim: true,
    },
    bateria: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

export interface ScheduleDocument {
  month: number;
  year: number;
  schedule: ScheduleEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ScheduleDocument>(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    schedule: {
      type: [scheduleEntrySchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

scheduleSchema.index({ month: 1, year: 1 }, { unique: true });

export const Schedule = model<ScheduleDocument>('Schedule', scheduleSchema);
