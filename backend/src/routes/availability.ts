import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.js';
import {
  findAvailability,
  replaceAvailability,
} from '../repositories/availabilityRepository.js';
import { resolveWorkspace } from '../repositories/workspaceRepository.js';
import type { AvailabilityOverride } from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/http.js';

export const availabilityRouter = Router();

availabilityRouter.use(authMiddleware);

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

availabilityRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.query);
    const workspace = await resolveWorkspace(request.userId);
    const overrides = await findAvailability(month, year, workspace);

    response.json({ month, year, overrides });
  }),
);

availabilityRouter.put(
  '/',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.query);
    const workspace = await resolveWorkspace(request.userId);
    const overrides = validateOverrides(request.body.overrides);
    const cleanedOverrides = overrides.filter(
      (override) => override.unavailableServiceKeys.length > 0,
    );

    await replaceAvailability(month, year, cleanedOverrides, workspace);

    response.json({ month, year, overrides: cleanedOverrides });
  }),
);
