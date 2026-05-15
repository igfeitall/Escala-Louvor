import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.js';
import {
  createMember,
  deleteMember,
  findMemberById,
  findMembers,
  toMemberRecord,
  updateMember,
} from '../repositories/membersRepository.js';
import { resolveWorkspace } from '../repositories/workspaceRepository.js';
import { validateMemberInput } from '../services/memberValidation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/http.js';

export const membersRouter = Router();

membersRouter.use(authMiddleware);

function getMemberId(input: unknown) {
  if (typeof input !== 'string' || !input) {
    throw new HttpError(400, 'Identificador invalido.');
  }

  return input;
}

membersRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const { ministryId } = await resolveWorkspace(request.userId);
    const members = await findMembers(ministryId);
    response.json(members.map((member) => toMemberRecord(member)));
  }),
);

membersRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const { ministryId } = await resolveWorkspace(request.userId);
    const data = validateMemberInput(request.body);
    const member = await createMember({ ...data, ministryId });
    response.status(201).json(toMemberRecord(member));
  }),
);

membersRouter.put(
  '/:id',
  asyncHandler(async (request, response) => {
    const memberId = getMemberId(request.params.id);
    const data = validateMemberInput(request.body);
    const existingMember = await findMemberById(memberId);

    if (!existingMember) {
      throw new HttpError(404, 'Membro nao encontrado.');
    }

    const member = await updateMember(memberId, data);

    if (!member) {
      throw new HttpError(404, 'Membro nao encontrado.');
    }

    response.json(toMemberRecord(member));
  }),
);

membersRouter.delete(
  '/:id',
  asyncHandler(async (request, response) => {
    const memberId = getMemberId(request.params.id);
    const deletedMember = await deleteMember(memberId);

    if (!deletedMember) {
      throw new HttpError(404, 'Membro nao encontrado.');
    }

    response.status(204).send();
  }),
);
