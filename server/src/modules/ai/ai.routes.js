// server/src/modules/ai/ai.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { extractRFQInputSchema, confirmExtractionSchema } from './ai.schema.js';
import * as aiController from './ai.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/:rfqId/extract',
  requireRole('ESTIMATOR'),
  validate(extractRFQInputSchema),
  asyncHandler(aiController.extractRFQ)
);

router.get(
  '/:rfqId/extractions',
  asyncHandler(aiController.listExtractions)
);

router.post(
  '/:rfqId/extractions/:extractionId/confirm',
  requireRole('ESTIMATOR'),
  validate(confirmExtractionSchema),
  asyncHandler(aiController.confirmExtraction)
);

export default router;
