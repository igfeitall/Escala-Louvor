export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/escala-louvor',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
};
