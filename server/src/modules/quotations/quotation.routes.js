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

const router = Router();

router.use(authenticate);

// Get quotation details by ID
router.get('/:id', asyncHandler(quotationController.getQuotation));

// Generate and stream industrial quotation PDF
router.get('/:id/pdf', asyncHandler(quotationController.downloadQuotationPDF));

// Submit quotation for commercial approval
router.post('/:id/submit', asyncHandler(quotationController.submitQuotation));

// Simulated customer dispatch
router.post(
  '/:id/send',
  validate(sendQuotationSchema),
  asyncHandler(quotationController.sendQuotation)
);

export default router;
