// server/src/modules/rates/rates.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  createRateSchema,
  listRatesQuerySchema,
  effectiveRatesQuerySchema,
} from './rates.validation.js';
import * as ratesController from './rates.controller.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listRatesQuerySchema, 'query'),
  asyncHandler(ratesController.listRates)
);

router.get(
  '/effective',
  validate(effectiveRatesQuerySchema, 'query'),
  asyncHandler(ratesController.getEffectiveRates)
);

router.get(
  '/:id/history',
  asyncHandler(ratesController.getRateHistory)
);

router.post(
  '/',
  requireRole('SALES_HEAD'),
  validate(createRateSchema),
  asyncHandler(ratesController.createRate)
);

export default router;
