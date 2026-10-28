import mongoose from 'mongoose';
import config from './env.js';

let isConnected = false;

/**
 * Sanitizes MongoDB connection URI for safe logging.
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  try {
    return uri.replace(/\/\/[^@]+@/, '//***:***@');
  } catch {
    return 'mongodb://[credentials-hidden]';
  }
};

/**
 * Connect to MongoDB with connection pooling and lifecycle listeners.
 */
export async function connectDB(uri = config.mongodbUri) {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  const sanitized = sanitizeMongoUri(uri);

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log(`[CTS Database] Connected to MongoDB: ${sanitized}`);
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error(`[CTS Database] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[CTS Database] Disconnected from MongoDB');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    isConnected = true;
    return mongoose.connection;
  } catch (err) {
    isConnected = false;
    console.error(`[CTS Database] Failed to connect to MongoDB: ${err.message}`);
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

/**
 * Gracefully close MongoDB connection.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[CTS Database] Disconnected gracefully from MongoDB');
  }
}

/**
 * Get current database connection state.
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    status: states[state] || 'unknown'
  };
}

export default { connectDB, disconnectDB, getDBStatus, sanitizeMongoUri };
