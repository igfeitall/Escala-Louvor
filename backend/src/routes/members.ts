import { Router } from 'express';

import { Member } from '../models/Member.js';
import { toMemberRecord } from '../services/memberSerializer.js';
import { validateMemberInput } from '../services/memberValidation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/http.js';

export const membersRouter = Router();

membersRouter.get(
  '/',
  asyncHandler(async (_request, response) => {
    const members = await Member.find().sort({ name: 1 });
    response.json(members.map((member) => toMemberRecord(member.toObject())));
  }),
);

membersRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const data = validateMemberInput(request.body);
    const member = await Member.create(data);
    response.status(201).json(toMemberRecord(member.toObject()));
  }),
);

membersRouter.put(
  '/:id',
  asyncHandler(async (request, response) => {
    const data = validateMemberInput(request.body);
    const member = await Member.findById(request.params.id);

    if (!member) {
      throw new HttpError(404, 'Membro não encontrado.');
    }

    member.name = data.name;
    member.roles = data.roles;
    member.notes = data.notes;
    await member.save();

    response.json(toMemberRecord(member.toObject()));
  }),
);

membersRouter.delete(
  '/:id',
  asyncHandler(async (request, response) => {
    const deletedMember = await Member.findByIdAndDelete(request.params.id);

    if (!deletedMember) {
      throw new HttpError(404, 'Membro não encontrado.');
    }

    response.status(204).send();
  }),
);
