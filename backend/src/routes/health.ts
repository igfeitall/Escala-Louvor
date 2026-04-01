import { Router } from 'express';

import { getDatabaseStatus } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  const database = getDatabaseStatus();
  const healthy = database === 'connected' || database === 'connecting';

  response.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database,
    timestamp: new Date().toISOString(),
  });
});
