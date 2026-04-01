import { ROLE_OPTIONS, type Role } from '../constants/roles.js';
import { HttpError } from '../utils/http.js';

interface MemberInput {
  name?: unknown;
  roles?: unknown;
  notes?: unknown;
}

export function validateMemberInput(input: MemberInput) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const roles = Array.isArray(input.roles) ? input.roles : [];
  const notes = typeof input.notes === 'string' ? input.notes.trim() : undefined;

  if (!name) {
    throw new HttpError(400, 'Nome é obrigatório.');
  }

  if (roles.length === 0) {
    throw new HttpError(400, 'Selecione ao menos uma função.');
  }

  const normalizedRoles = roles.map((role) => {
    if (typeof role !== 'string') {
      throw new HttpError(400, 'Funções inválidas.');
    }

    const trimmedRole = role.trim().toUpperCase();

    if (!ROLE_OPTIONS.includes(trimmedRole as Role)) {
      throw new HttpError(400, `Função inválida: ${role}`);
    }

    return trimmedRole as Role;
  });

  return {
    name,
    roles: normalizedRoles.filter((role, index) => normalizedRoles.indexOf(role) === index),
    notes: notes || undefined,
  };
}
