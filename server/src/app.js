// server/src/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import rfqRoutes from './modules/rfqs/rfqs.routes.js';
import partRoutes from './modules/parts/parts.routes.js';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS allowlist
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// Body & Cookie Parsers
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Request tracking & logging
app.use(requestId);
app.use(pinoHttp({
  logger,
  autoLogging: env.NODE_ENV !== 'test',
  customProps: (req) => ({ requestId: req.id }),
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.',
      details: [],
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Health Check Endpoint (Required for Docker & Cloud Platforms)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'forgequote-api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    requestId: req.id,
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rfqs', rfqRoutes);
app.use('/api/v1/parts', partRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
});

// Centralized error handling
app.use(errorHandler);

export default app;
