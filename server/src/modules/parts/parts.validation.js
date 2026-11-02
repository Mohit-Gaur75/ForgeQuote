// server/src/modules/parts/parts.validation.js
import { z } from 'zod';

export const createPartSchema = z.object({
  partNumber: z.string().optional().nullable(),
  partName: z.string().min(2, 'Part name must be at least 2 characters').trim(),
  material: z.string().optional().nullable(),
  grossWeightKg: z.coerce.number().positive('Gross weight must be positive').optional().nullable(),
  netWeightKg: z.coerce.number().positive('Net weight must be positive').optional().nullable(),
  scrapPercentage: z.coerce.number().min(0, 'Scrap cannot be negative').max(99.99, 'Scrap must be less than 100%').optional().nullable(),
  annualVolume: z.coerce.number().int().positive('Annual volume must be positive').optional().nullable(),
  setupHours: z.coerce.number().min(0, 'Setup hours cannot be negative').optional().nullable(),
});

export const updatePartSchema = createPartSchema.partial();
