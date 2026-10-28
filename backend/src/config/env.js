import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
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
  isProduction: process.env.NODE_ENV === 'production',
  aiProvider: (process.env.AI_PROVIDER || 'groq').trim().toLowerCase(),
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  aiTimeoutMs: parseInt(process.env.AI_TIMEOUT_MS || process.env.GEMINI_TIMEOUT_MS || '4000', 10),
  geminiTimeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || process.env.AI_TIMEOUT_MS || '4000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chaos_to_solution',
  eventId: process.env.EVENT_ID || 'cts-2026',
  eventAdminToken: process.env.EVENT_ADMIN_TOKEN || '',
  eventTimerDurationMs: parseInt(process.env.EVENT_TIMER_DURATION_MS || '14400000', 10)
});

export default config;
