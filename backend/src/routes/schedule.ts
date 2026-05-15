import { Router } from 'express';
import multer from 'multer';

import { authMiddleware } from '../middleware/auth.js';
import {
  findMemberLookups,
  findMembers,
  toMemberRecord,
} from '../repositories/membersRepository.js';
import { findSavedSchedule, saveSchedule } from '../repositories/savedSchedulesRepository.js';
import { resolveWorkspace } from '../repositories/workspaceRepository.js';
import { buildScheduleCsv } from '../services/csv.js';
import { parseSpreadsheet } from '../services/parser.js';
import { generateSchedule } from '../services/scheduler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/http.js';

const upload = multer({ storage: multer.memoryStorage() });

export const scheduleRouter = Router();

scheduleRouter.use(authMiddleware);

function parseMonthYear(input: { month?: unknown; year?: unknown }) {
  const month = Number(input.month);
  const year = Number(input.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new HttpError(400, 'Mês inválido.');
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new HttpError(400, 'Ano inválido.');
  }

  return { month, year };
}

scheduleRouter.post(
  '/parse',
  upload.single('file'),
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.body);
    const workspace = await resolveWorkspace(request.userId);

    if (!request.file?.buffer) {
      throw new HttpError(400, 'Arquivo é obrigatório.');
    }

    const members = await findMemberLookups(workspace.ministryId);
    const result = parseSpreadsheet(
      request.file.buffer,
      month,
      year,
      members.map((member) => ({
        id: member.id,
        name: member.name,
        normalizedName: member.normalized_name,
      })),
    );

    response.json(result);
  }),
);

scheduleRouter.post(
  '/generate',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.body);
    const workspace = await resolveWorkspace(request.userId);
    const overrides = Array.isArray(request.body.overrides) ? request.body.overrides : [];
    const members = await findMembers(workspace.ministryId);
    const serializedMembers = members.map((member) => toMemberRecord(member));
    const schedule = generateSchedule(serializedMembers, overrides, month, year);

    response.json({ month, year, schedule });
  }),
);

scheduleRouter.get(
  '/saved',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.query);
    const workspace = await resolveWorkspace(request.userId);
    const schedule = await findSavedSchedule(month, year, workspace);

    response.json({ month, year, schedule });
  }),
);

scheduleRouter.post(
  '/saved',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.body);
    const workspace = await resolveWorkspace(request.userId);
    const schedule = Array.isArray(request.body.schedule) ? request.body.schedule : null;

    if (!schedule) {
      throw new HttpError(400, 'Agenda inválida.');
    }

    await saveSchedule(month, year, schedule, workspace);
    response.status(201).json({ month, year, schedule });
  }),
);

scheduleRouter.post(
  '/export-csv',
  asyncHandler(async (request, response) => {
    const schedule = Array.isArray(request.body.schedule) ? request.body.schedule : null;

    if (!schedule) {
      throw new HttpError(400, 'Agenda inválida.');
    }

    const csv = buildScheduleCsv(schedule);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="escala-louvor.csv"');
    response.send(csv);
  }),
);
