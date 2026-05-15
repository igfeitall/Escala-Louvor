import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../services/jwt.js';
import { HttpError } from '../utils/http.js';

// Extende o tipo Request do Express para incluir o userId autenticado
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token de autenticação ausente.');
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    request.userId = payload.userId;
    next();
  } catch {
    throw new HttpError(401, 'Token inválido ou expirado.');
  }
}
