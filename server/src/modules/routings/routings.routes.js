// server/src/modules/routings/routings.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as routingController from './routings.controller.js';

const router = Router();

router.use(authenticate);

// Get deterministic routing suggestions for a part
router.get('/:id/routing-suggestions', asyncHandler(routingController.getSuggestions));

// Clone / apply routing from a historical part
router.post(
  '/:id/apply-routing',
  requireRole('ESTIMATOR'),
  asyncHandler(routingController.applySuggestion)
);

export default router;
