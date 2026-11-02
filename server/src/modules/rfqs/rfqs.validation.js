// server/src/modules/rfqs/rfqs.validation.js
import { z } from 'zod';

export const createRFQSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').trim(),
  customerType: z.string().optional().nullable(),
  receivedAt: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateRFQSchema = z.object({
  customerName: z.string().min(2).trim().optional(),
  customerType: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  lostReason: z.string().optional().nullable(),
});

export const updateRFQStatusSchema = z.object({
  status: z.enum(['ESTIMATING', 'SENT', 'WON', 'LOST']),
  lostReason: z.string().optional().nullable(),
});

export const listRFQsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ESTIMATING', 'SENT', 'WON', 'LOST']).optional(),
  ownerId: z.string().uuid().optional(),
  isOverdue: z.enum(['true', 'false']).optional(),
  sort: z.enum(['dueDate:asc', 'dueDate:desc', 'createdAt:asc', 'createdAt:desc']).default('createdAt:desc'),
});
