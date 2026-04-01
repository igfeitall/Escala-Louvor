import mongoose from 'mongoose';

import { env } from './env.js';

export async function connectDatabase() {
  await mongoose.connect(env.mongoUri);
}

export function getDatabaseStatus() {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}
