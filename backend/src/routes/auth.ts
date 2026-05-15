import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { findUserByEmail } from '../repositories/usersRepository.js';
import { signToken } from '../services/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/http.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (request, response) => {
    const { email, password } = request.body as { email?: unknown; password?: unknown };

    if (typeof email !== 'string' || !email.trim()) {
      throw new HttpError(400, 'Email é obrigatório.');
    }

    if (typeof password !== 'string' || !password) {
      throw new HttpError(400, 'Senha é obrigatória.');
    }

    const user = await findUserByEmail(email.trim().toLowerCase());

    if (!user) {
      throw new HttpError(401, 'Credenciais inválidas.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      throw new HttpError(401, 'Credenciais inválidas.');
    }

    const token = signToken({ userId: user.id, email: user.email });

    response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        churchName: user.church_name,
        churchPhone: user.church_phone,
      },
    });
  }),
);
