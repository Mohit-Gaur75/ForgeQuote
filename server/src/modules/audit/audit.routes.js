// server/src/modules/audit/audit.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as auditController from './audit.controller.js';

const router = Router();

router.use(authenticate);

// Specific entity lookup: GET /api/v1/audit/:entityType/:entityId
router.get('/:entityType/:entityId', asyncHandler(auditController.getAuditHistory));

// Query-based lookup: GET /api/v1/audit?entityType=...&entityId=...
router.get('/', asyncHandler(auditController.getAuditHistory));

export default router;
