import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/env.js';
import healthRouter from './routes/health.routes.js';
import mockRouter from './routes/mock.routes.js';
import challengeRouter from './routes/challenge.routes.js';
import teamRouter from './routes/team.routes.js';
import timerRouter from './routes/timer.routes.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Security and CORS middleware
app.use(helmet());

const corsOriginDelegate = (origin, callback) => {
  // Allow requests with no origin (e.g. mobile apps, curl, or server-to-server)
  if (!origin) {
    return callback(null, true);
  }

  // Wildcard allow if configured
  if (config.corsOrigins === '*') {
    return callback(null, true);
  }

  // Explicit allowed origins list
  if (Array.isArray(config.corsOrigins) && config.corsOrigins.includes(origin)) {
    return callback(null, true);
  }

  // Allow Vercel preview and production subdomains
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
    return callback(null, true);
  }

  return callback(null, false);
};

app.use(
  cors({
    origin: corsOriginDelegate,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsing middleware
app.use(express.json());

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/mock', mockRouter);
app.use('/api/challenges', challengeRouter);
app.use('/api/teams', teamRouter);
app.use('/api/event-timer', timerRouter);

// 404 Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
