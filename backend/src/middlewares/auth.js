import crypto from 'crypto';
import config from '../config/env.js';

/**
 * Middleware that validates the operator Bearer token for event administration.
 */
export function requireOperatorAuth(req, res, next) {
  const configuredToken = (process.env.EVENT_ADMIN_TOKEN || config.eventAdminToken || '').trim();

  if (!configuredToken) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'OPERATOR_AUTH_NOT_CONFIGURED',
        message: 'Timer control operations are disabled because EVENT_ADMIN_TOKEN is not configured.'
      }
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing Authorization header. Operator token required.'
      }
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_AUTH_FORMAT',
        message: 'Invalid Authorization header format. Expected: Bearer <TOKEN>'
      }
    });
  }

  const suppliedToken = parts[1].trim();

  // Timing-safe comparison to prevent timing side-channel attacks
  try {
    const suppliedBuf = Buffer.from(suppliedToken);
    const configuredBuf = Buffer.from(configuredToken);

    if (
      suppliedBuf.length !== configuredBuf.length ||
      !crypto.timingSafeEqual(suppliedBuf, configuredBuf)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid operator token provided.'
        }
      });
    }
  } catch {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid operator token provided.'
      }
    });
  }

  next();
}

export default requireOperatorAuth;
