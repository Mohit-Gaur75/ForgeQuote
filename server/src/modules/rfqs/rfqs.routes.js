// server/src/modules/rfqs/rfqs.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  createRFQSchema,
  updateRFQSchema,
  updateRFQStatusSchema,
  listRFQsQuerySchema,
} from './rfqs.validation.js';
import * as rfqController from './rfqs.controller.js';
import * as partController from '../parts/parts.controller.js';
import { createPartSchema } from '../parts/parts.validation.js';
import * as quotationController from '../quotations/quotation.controller.js';
import { createQuotationSchema } from '../quotations/quotation.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listRFQsQuerySchema, 'query'),
  asyncHandler(rfqController.listRFQs)
);

router.post(
  '/',
  requireRole('ESTIMATOR'),
  validate(createRFQSchema),
  asyncHandler(rfqController.createRFQ)
);

router.get(
  '/:id',
  asyncHandler(rfqController.getRFQ)
);

// Stream Bill of Materials & Routing Excel Workbook
router.get(
  '/:id/export-excel',
  asyncHandler(rfqController.exportRFQExcel)
);

router.patch(
  '/:id',
  requireRole('ESTIMATOR'),
  validate(updateRFQSchema),
  asyncHandler(rfqController.updateRFQ)
);

router.patch(
  '/:id/status',
  requireRole('SALES_HEAD'),
  validate(updateRFQStatusSchema),
  asyncHandler(rfqController.updateRFQStatus)
);

router.post(
  '/:rfqId/parts',
  requireRole('ESTIMATOR'),
  validate(createPartSchema),
  asyncHandler(partController.createPart)
);

router.post(
  '/:rfqId/quotations',
  requireRole('ESTIMATOR'),
  validate(createQuotationSchema),
  asyncHandler(quotationController.createQuotation)
);

export default router;
