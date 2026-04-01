import { Schema, model } from 'mongoose';

export interface MonthlyAvailabilityDocument {
  memberId: string;
  month: number;
  year: number;
  unavailableServiceKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}

const monthlyAvailabilitySchema = new Schema<MonthlyAvailabilityDocument>(
  {
    memberId: {
      type: String,
      required: true,
      index: true,
    },
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
    unavailableServiceKeys: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

monthlyAvailabilitySchema.index({ memberId: 1, month: 1, year: 1 }, { unique: true });

export const MonthlyAvailability = model<MonthlyAvailabilityDocument>(
  'MonthlyAvailability',
  monthlyAvailabilitySchema,
);
