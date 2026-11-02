// server/src/modules/ai/ai.schema.js
import { z } from 'zod';

export const ExtractedFieldSchema = z.object({
  value: z.union([z.string(), z.number(), z.null()]),
  confidence: z.number().min(0).max(1).nullable(),
  sourceType: z.enum(['EMAIL', 'PART_LIST', 'INFERRED', 'UNKNOWN']).default('UNKNOWN'),
  sourceText: z.string().nullable().default(null),
  uncertaintyExplanation: z.string().nullable().optional(),
  verificationStatus: z.enum(['PENDING', 'ACCEPTED', 'EDITED', 'REJECTED']).default('PENDING'),
});

export const ExtractedPartSchema = z.object({
  partName: ExtractedFieldSchema,
  partNumber: ExtractedFieldSchema,
  material: ExtractedFieldSchema,
  grossWeightKg: ExtractedFieldSchema,
  netWeightKg: ExtractedFieldSchema,
  annualVolume: ExtractedFieldSchema,
});

export const AIExtractionResultSchema = z.object({
  customerName: ExtractedFieldSchema,
  dueDate: ExtractedFieldSchema,
  parts: z.array(ExtractedPartSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export const extractRFQInputSchema = z.object({
  emailText: z.string().optional().default(''),
  partListText: z.string().optional().default(''),
}).refine(
  data => (data.emailText && data.emailText.trim().length > 0) || (data.partListText && data.partListText.trim().length > 0),
  { message: 'At least one of email text or part list text must be provided' }
);

export const confirmExtractionSchema = z.object({
  confirmedCustomerName: z.string().optional().nullable(),
  confirmedDueDate: z.string().datetime().optional().nullable(),
  parts: z.array(z.object({
    partName: z.string().min(2, 'Part name is required'),
    partNumber: z.string().optional().nullable(),
    material: z.string().optional().nullable(),
    grossWeightKg: z.coerce.number().positive().optional().nullable(),
    netWeightKg: z.coerce.number().positive().optional().nullable(),
    scrapPercentage: z.coerce.number().min(0).max(99.99).optional().default(5.0),
    annualVolume: z.coerce.number().int().positive().optional().nullable(),
    setupHours: z.coerce.number().min(0).optional().default(2.0),
  })).min(1, 'At least one verified part is required'),
});
