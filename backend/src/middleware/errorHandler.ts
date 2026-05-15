import type { NextFunction, Request, Response } from 'express';
import type { DatabaseError } from 'pg';

import { HttpError } from '../utils/http.js';

function isDatabaseError(error: unknown): error is DatabaseError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  void next;

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (isDatabaseError(error)) {
    switch (error.code) {
      case '23505':
        response.status(409).json({ message: 'Ja existe um registro com estes dados.' });
        return;
      case '23503':
        response.status(400).json({ message: 'Registro relacionado nao encontrado.' });
        return;
      case '23514':
        response.status(400).json({ message: 'Dados invalidos para esta regra do banco.' });
        return;
      case '22P02':
        response.status(400).json({ message: 'Identificador invalido.' });
        return;
    }
  }

  const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
  response.status(500).json({ message });
}
