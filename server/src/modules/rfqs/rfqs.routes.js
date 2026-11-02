// server/src/modules/rfqs/rfqs.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  createRFQSchema,
  updateRFQSchema,
  updateRFQStatusSchema,
  listRFQsQuerySchema,
} from './rfqs.validation.js';
import * as rfqController from './rfqs.controller.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listRFQsQuerySchema, 'query'),
  asyncHandler(rfqController.listRFQs)
);

router.post(
  '/',
  requireRole('ESTIMATOR'),
  validate(createRFQSchema),
  asyncHandler(rfqController.createRFQ)
);

router.get(
  '/:id',
  asyncHandler(rfqController.getRFQ)
);

router.patch(
  '/:id',
  requireRole('ESTIMATOR'),
  validate(updateRFQSchema),
  asyncHandler(rfqController.updateRFQ)
);

router.patch(
  '/:id/status',
  requireRole('SALES_HEAD'),
  validate(updateRFQStatusSchema),
  asyncHandler(rfqController.updateRFQStatus)
);

export default router;
