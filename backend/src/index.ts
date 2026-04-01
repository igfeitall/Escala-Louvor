import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function start() {
  await connectDatabase();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Escala Louvor API running on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
