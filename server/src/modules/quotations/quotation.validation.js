// server/src/modules/quotations/quotation.validation.js
import { z } from 'zod';

export const createQuotationSchema = z.object({
  marginPercentage: z.coerce.number().min(0).max(99.99).default(15.0),
  gstPercentage: z.coerce.number().min(0).max(100).default(18.0),
  partIds: z.array(z.string().uuid()).optional(),
  customNotes: z.string().max(1000).optional(),
});

export const sendQuotationSchema = z.object({
  recipientEmail: z.string().email().optional(),
  emailSubject: z.string().max(200).optional(),
  customMessage: z.string().max(2000).optional(),
});
