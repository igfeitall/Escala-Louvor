import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import { HttpError } from '../utils/http.js';

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

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({ message: error.message });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  ) {
    response.status(409).json({ message: 'Já existe um membro com este nome.' });
    return;
  }

  const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
  response.status(500).json({ message });
}
