// server/src/modules/rates/rates.validation.js
import { z } from 'zod';

export const RateTypeEnum = z.enum([
  'MATERIAL',
  'MACHINE_HOUR',
  'OVERHEAD',
  'PACKING',
  'FREIGHT',
  'GST',
]);

export const createRateSchema = z.object({
  rateType: RateTypeEnum,
  rateName: z.string().min(2, 'Rate name must be at least 2 characters').trim(),
  materialGrade: z.string().optional().nullable(),
  machineType: z.string().optional().nullable(),
  rateValue: z.coerce.number().positive('Rate value must be positive'),
  unit: z.string().min(1, 'Unit is required').trim(),
  currency: z.string().default('INR'),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional().nullable(),
}).refine(
  data => !data.effectiveTo || new Date(data.effectiveTo) > new Date(data.effectiveFrom),
  { message: 'effectiveTo must be strictly after effectiveFrom', path: ['effectiveTo'] }
);

export const listRatesQuerySchema = z.object({
  rateType: RateTypeEnum.optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const effectiveRatesQuerySchema = z.object({
  at: z.string().datetime().optional(),
  rateType: RateTypeEnum.optional(),
});
