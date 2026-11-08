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
import aiRoutes from './modules/ai/ai.routes.js';
import ratesRoutes from './modules/rates/rates.routes.js';
import costingRoutes from './modules/costing/costing.routes.js';
import quotationRoutes from './modules/quotations/quotation.routes.js';
import approvalRoutes from './modules/approvals/approval.routes.js';
import routingsRoutes from './modules/routings/routings.routes.js';
import historyRoutes from './modules/history/history.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS allowlist supporting single or comma-separated origins
const rawOrigins = (env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
const defaultOrigins = ['http://localhost:5173', 'http://localhost:8080', 'http://localhost'];
const allowedOrigins = Array.from(new Set([...rawOrigins, ...defaultOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, docker healthcheck, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// Body & Cookie Parsers (supports bulk Excel import payloads)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Health Check Endpoint (Required for Docker & Cloud Platforms — placed before rate limiting)
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

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rfqs', rfqRoutes);
app.use('/api/v1/rfqs', aiRoutes);
app.use('/api/v1/parts', partRoutes);
app.use('/api/v1/parts', costingRoutes);
app.use('/api/v1/rates', ratesRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/parts', routingsRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/audit', auditRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
});

// Centralized error handling
app.use(errorHandler);

export default app;
