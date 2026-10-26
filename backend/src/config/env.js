import dotenv from 'dotenv';

dotenv.config();

const parseCorsOrigins = (rawOrigins) => {
  if (!rawOrigins || rawOrigins === '*') {
    return '*';
  }
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const config = Object.freeze({
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000'),
  isProduction: process.env.NODE_ENV === 'production'
});

export default config;
