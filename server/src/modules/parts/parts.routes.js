// server/src/modules/parts/parts.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { updatePartSchema } from './parts.validation.js';
import * as partController from './parts.controller.js';

const router = Router();

router.use(authenticate);

router.get('/:id', asyncHandler(partController.getPart));
router.patch(
  '/:id',
  requireRole('ESTIMATOR'),
  validate(updatePartSchema),
  asyncHandler(partController.updatePart)
);
router.delete(
  '/:id',
  requireRole('ESTIMATOR'),
  asyncHandler(partController.deletePart)
);

export default router;
