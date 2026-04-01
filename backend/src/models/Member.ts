import { Schema, model } from 'mongoose';

import { ROLE_OPTIONS, type Role } from '../constants/roles.js';
import { normalizeName } from '../utils/normalize.js';

export interface MemberDocument {
  name: string;
  normalizedName: string;
  roles: Role[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<MemberDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roles: {
      type: [String],
      enum: ROLE_OPTIONS,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

memberSchema.pre('validate', function setNormalizedName(next) {
  this.normalizedName = normalizeName(this.name);
  next();
});

export const Member = model<MemberDocument>('Member', memberSchema);
