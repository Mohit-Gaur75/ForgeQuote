// server/src/modules/approvals/approval.validation.js
import { z } from 'zod';

export const approvalDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: 'Decision must be either APPROVE or REJECT' }),
  }),
  comment: z.string().max(1000).optional(),
});
