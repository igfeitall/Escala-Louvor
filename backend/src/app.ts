import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { membersRouter } from './routes/members.js';
import { scheduleRouter } from './routes/schedule.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [env.clientOrigin, 'http://localhost:3000', 'http://localhost:5173'],
    }),
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/', (_request, response) => {
    response.json({ name: 'Escala Louvor API' });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/members', membersRouter);
  app.use('/api/schedule', scheduleRouter);
  app.use(errorHandler);

  return app;
}
