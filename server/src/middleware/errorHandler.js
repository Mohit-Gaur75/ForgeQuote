// server/src/middleware/errorHandler.js
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  const requestId = req.id || 'unknown';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message);
    }
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || [],
      },
      requestId,
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with this identifier already exists',
        details: err.meta?.target || [],
      },
      requestId,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Record not found',
        details: [],
      },
      requestId,
    });
  }

  logger.error({ err, requestId }, 'Unhandled internal server error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      details: [],
    },
    requestId,
  });
}
