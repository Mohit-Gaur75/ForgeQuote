// server/src/modules/costing/costing.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  calculateCostingInputSchema,
  saveCostingInputSchema,
} from './costing.validation.js';
import * as costingController from './costing.controller.js';

const router = Router();

router.use(authenticate);

router.post(
  '/:id/calculate',
  validate(calculateCostingInputSchema),
  asyncHandler(costingController.calculateCosting)
);

router.post(
  '/:id/save-costing',
  requireRole('ESTIMATOR'),
  validate(saveCostingInputSchema),
  asyncHandler(costingController.saveCosting)
);

router.get(
  '/:id/costing',
  asyncHandler(costingController.getCosting)
);

export default router;
