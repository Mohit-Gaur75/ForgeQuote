// server/src/modules/costing/costing.validation.js
import { z } from 'zod';

export const operationInputSchema = z.object({
  operationSequence: z.coerce.number().int().min(1).optional(),
  operationName: z.string().min(2, 'Operation name is required').trim(),
  machineType: z.string().min(2, 'Machine type is required').trim(),
  cycleTimeMinutes: z.coerce.number().min(0, 'Cycle time cannot be negative'),
  machineHourRate: z.coerce.number().min(0, 'Machine-hour rate cannot be negative'),
  machineRateVersionId: z.string().uuid().optional().nullable(),
  setupHours: z.coerce.number().min(0, 'Setup hours cannot be negative').optional().default(0),
});

export const calculateCostingInputSchema = z.object({
  netWeightKg: z.coerce.number().positive('Net weight must be positive'),
  grossWeightKg: z.coerce.number().positive('Gross weight must be positive').optional().nullable(),
  scrapPercentage: z.coerce.number().min(0).max(99.99, 'Scrap must be less than 100%').default(5.0),
  materialRatePerKg: z.coerce.number().positive('Material rate must be positive'),
  operations: z.array(operationInputSchema).min(1, 'At least one machining operation is required'),
  partSetupHours: z.coerce.number().min(0).optional().default(0),
  annualVolume: z.coerce.number().int().positive('Annual volume must be positive'),
  overheadPercentage: z.coerce.number().min(0).max(100).default(4.0),
  packingPerUnit: z.coerce.number().min(0).default(0),
  freightPerUnit: z.coerce.number().min(0).default(0),
  grossMarginPercentage: z.coerce.number().min(0).max(99.99, 'Gross margin must be less than 100%').default(15.0),
  gstPercentage: z.coerce.number().min(0).max(100).default(18.0),
  tierVolumes: z.array(z.coerce.number().int().positive()).optional(),
});

export const saveCostingInputSchema = calculateCostingInputSchema;
