import { Router } from 'express';
import multer from 'multer';

import { Member } from '../models/Member.js';
import { buildScheduleCsv } from '../services/csv.js';
import { toMemberRecord } from '../services/memberSerializer.js';
import { parseSpreadsheet } from '../services/parser.js';
import { generateSchedule } from '../services/scheduler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/http.js';
import { normalizeName } from '../utils/normalize.js';

const upload = multer({ storage: multer.memoryStorage() });

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

export const scheduleRouter = Router();

scheduleRouter.post(
  '/parse',
  upload.single('file'),
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.body);

    if (!request.file?.buffer) {
      throw new HttpError(400, 'Arquivo é obrigatório.');
    }

    const members = await Member.find().select('_id name normalizedName');
    const result = parseSpreadsheet(
      request.file.buffer,
      month,
      year,
      members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        normalizedName: normalizeName(member.name),
      })),
    );

    response.json(result);
  }),
);

scheduleRouter.post(
  '/generate',
  asyncHandler(async (request, response) => {
    const { month, year } = parseMonthYear(request.body);
    const overrides = Array.isArray(request.body.overrides) ? request.body.overrides : [];
    const members = await Member.find().sort({ name: 1 });
    const serializedMembers = members.map((member) => toMemberRecord(member.toObject()));
    const schedule = generateSchedule(serializedMembers, overrides, month, year);

    response.json({ month, year, schedule });
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
