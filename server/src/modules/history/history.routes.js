// server/src/modules/history/history.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as historyController from './history.controller.js';

const router = Router();

router.use(authenticate);

// Search historical parts and previous quotes
router.get('/search', asyncHandler(historyController.searchHistory));

export default router;
