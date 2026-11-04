// server/src/modules/approvals/approval.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { approvalDecisionSchema } from './approval.validation.js';
import * as approvalController from './approval.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('SALES_HEAD'));

router.get('/', asyncHandler(approvalController.listPendingApprovals));
router.post(
  '/:id/decision',
  validate(approvalDecisionSchema),
  asyncHandler(approvalController.processDecision)
);

export default router;
