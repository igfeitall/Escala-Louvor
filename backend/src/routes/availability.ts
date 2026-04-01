import { Router } from 'express';

import { MonthlyAvailability } from '../models/MonthlyAvailability.js';
import type { AvailabilityOverride } from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/http.js';

function parseMonthYear(input: { month?: unknown; year?: unknown }) {
  const month = Number(input.month);
  const year = Number(input.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new HttpError(400, 'Mes invalido.');
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new HttpError(400, 'Ano invalido.');
  }

  return { month, year };
}

function validateOverrides(input: unknown): AvailabilityOverride[] {
  if (!Array.isArray(input)) {
    throw new HttpError(400, 'Overrides invalidos.');
  }

  return input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new HttpError(400, 'Override invalido.');
    }

    const memberId =
      'memberId' in entry && typeof entry.memberId === 'string' ? entry.memberId.trim() : '';
    const unavailableServiceKeys: string[] =
      'unavailableServiceKeys' in entry && Array.isArray(entry.unavailableServiceKeys)
        ? entry.unavailableServiceKeys.filter(
            (value: unknown): value is string => typeof value === 'string',
          )
        : [];

    if (!memberId) {
      throw new HttpError(400, 'memberId e obrigatorio.');
    }

    return {
      memberId,
      unavailableServiceKeys: [...new Set(unavailableServiceKeys)].sort(),
    };
  });
}

export const availabilityRouter = Router();

availabilityRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.query);
    const documents = await MonthlyAvailability.find({ month, year }).sort({ memberId: 1 });

    response.json({
      month,
      year,
      overrides: documents.map((document) => ({
        memberId: document.memberId,
        unavailableServiceKeys: document.unavailableServiceKeys,
      })),
    });
  }),
);

availabilityRouter.put(
  '/',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.query);
    const overrides = validateOverrides(request.body.overrides);
    const cleanedOverrides = overrides.filter((override) => override.unavailableServiceKeys.length > 0);

    await MonthlyAvailability.deleteMany({ month, year });

    if (cleanedOverrides.length > 0) {
      await MonthlyAvailability.insertMany(
        cleanedOverrides.map((override) => ({
          memberId: override.memberId,
          month,
          year,
          unavailableServiceKeys: override.unavailableServiceKeys,
        })),
      );
    }

    response.json({
      month,
      year,
      overrides: cleanedOverrides,
    });
  }),
);
