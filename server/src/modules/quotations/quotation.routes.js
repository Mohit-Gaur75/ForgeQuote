// server/src/modules/quotations/quotation.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  createQuotationSchema,
  sendQuotationSchema,
} from './quotation.validation.js';
import * as quotationController from './quotation.controller.js';
import { processApprovalDecision } from '../approvals/approval.service.js';

const router = Router();

router.use(authenticate);

// Get quotation details by ID
router.get('/:id', asyncHandler(quotationController.getQuotation));

// Generate and stream industrial quotation PDF
router.get('/:id/pdf', asyncHandler(quotationController.downloadQuotationPDF));

// Submit quotation for commercial approval
router.post('/:id/submit', asyncHandler(quotationController.submitQuotation));

// Direct approval / rejection aliases (contract compliance)
router.post(
  '/:id/approve',
  requireRole('SALES_HEAD'),
  asyncHandler(async (req, res) => {
    const result = await processApprovalDecision(req.user, req.params.id, {
      decision: 'APPROVE',
      comment: req.body?.comment || 'Approved via commercial review',
    });
    res.status(200).json({ success: true, data: result, requestId: req.id });
  })
);

router.post(
  '/:id/reject',
  requireRole('SALES_HEAD'),
  asyncHandler(async (req, res) => {
    const result = await processApprovalDecision(req.user, req.params.id, {
      decision: 'REJECT',
      comment: req.body?.comment || 'Rejected during commercial review',
    });
    res.status(200).json({ success: true, data: result, requestId: req.id });
  })
);

// Simulated customer dispatch
router.post(
  '/:id/send',
  validate(sendQuotationSchema),
  asyncHandler(quotationController.sendQuotation)
);

export default router;
