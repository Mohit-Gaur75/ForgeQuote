// server/src/config/logger.js
import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  redact: {
    paths: [
      'req.headers.cookie',
      'req.body.password',
      '*.passwordHash',
      '*.tokenHash',
      'req.body.emailText'
    ],
    censor: '[REDACTED]',
  },
});
