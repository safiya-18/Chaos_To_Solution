import app from './app.js';
import config from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`[CTS Backend] Server running on port ${config.port} (${config.nodeEnv})`);
  console.log(`[CTS Backend] Health check: http://localhost:${config.port}/api/health`);
});

const handleShutdown = (signal) => {
  console.log(`\n[CTS Backend] Received ${signal}. Shutting down gracefully...`);
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
