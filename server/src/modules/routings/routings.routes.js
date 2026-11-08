// server/src/modules/routings/routings.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as routingController from './routings.controller.js';

const router = Router();

router.use(authenticate);

// Plant Head (and all roles) view routing checks
router.get('/checks', asyncHandler(routingController.getRoutingChecks));

// Get deterministic routing suggestions for a part (supports both GET and POST)
router.get('/:id/routing-suggestions', asyncHandler(routingController.getSuggestions));
router.post('/:id/routing-suggestions', asyncHandler(routingController.getSuggestions));

// Clone / apply routing from a historical part (supports both endpoints)
router.post(
  '/:id/apply-routing',
  requireRole('ESTIMATOR'),
  asyncHandler(routingController.applySuggestion)
);
router.post(
  '/:id/apply-routing-suggestion',
  requireRole('ESTIMATOR'),
  asyncHandler(routingController.applySuggestion)
);

export default router;
