import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

describe('app', () => {
  it('returns degraded health when database is disconnected', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.database).toBe('disconnected');
  });
});
