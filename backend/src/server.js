import app from './app.js';
import config from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

// Attempt non-blocking DB connection at server launch
if (config.mongodbUri) {
  connectDB().catch((err) => {
    console.warn(`[CTS Backend] MongoDB initial connection deferred: ${err.message}`);
  });
}

const server = app.listen(config.port, () => {
  console.log(`[CTS Backend] Server running on port ${config.port} (${config.nodeEnv})`);
  console.log(`[CTS Backend] Health check: http://localhost:${config.port}/api/health`);
});

const handleShutdown = async (signal) => {
  console.log(`\n[CTS Backend] Received ${signal}. Shutting down gracefully...`);
  try {
    await disconnectDB();
  } catch (err) {
    console.error(`[CTS Backend] Error disconnecting DB during shutdown: ${err.message}`);
  }

  server.close(() => {
    console.log('[CTS Backend] Server closed successfully.');
    process.exit(0);
  });

  // Force shutdown if connections do not close in 5s
  setTimeout(() => {
    console.error('[CTS Backend] Forced shutdown due to timeout.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default server;
