// server/src/modules/history/history.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as historyController from './history.controller.js';

const router = Router();

router.use(authenticate);

// Search historical parts and previous quotes
router.get('/search', asyncHandler(historyController.searchHistory));

// Bulk import past quotes from Excel (.xlsx)
router.post('/import-excel', asyncHandler(historyController.importPastQuotes));

// Download blank template
router.get('/template-excel', asyncHandler(historyController.downloadImportTemplate));

// Download sample 1400 quotes workbook
router.get('/sample-excel', asyncHandler(historyController.downloadSample1400Workbook));

export default router;
