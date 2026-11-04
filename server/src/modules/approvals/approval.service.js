// server/src/modules/approvals/approval.service.js
import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from '../../utils/errors.js';

/**
 * List all quotations currently awaiting commercial sign-off
 * Only accessible to SALES_HEAD
 */
export async function listPendingApprovals(user) {
  if (user.role !== 'SALES_HEAD') {
    throw new AuthorizationError('Only the Sales Head can review commercial approvals');
  }

  const pendingQuotes = await prisma.quotation.findMany({
    where: {
      status: 'PENDING_APPROVAL',
    },
    include: {
      rfq: {
        select: {
          id: true,
          rfqNumber: true,
          customerName: true,
          dueDate: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      parts: {
        select: {
          id: true,
          partId: true,
          quotedAnnualVolume: true,
          sellingPriceBeforeGST: true,
          sellingPriceIncludingGST: true,
          marginPercentage: true,
          part: {
            select: {
              partName: true,
              partNumber: true,
              material: true,
            },
          },
        },
      },
      approvals: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Attach anti-self-approval flag for front-end safety
  return pendingQuotes.map((q) => ({
    ...q,
    canApprove: q.createdBy !== user.id,
    antiSelfApprovalViolation: q.createdBy === user.id,
  }));
}

/**
 * Process commercial approval or rejection with strict anti-self-approval rule
 */
export async function processApprovalDecision(user, quotationId, { decision, comment }) {
  if (user.role !== 'SALES_HEAD') {
    throw new AuthorizationError('Only the Sales Head can authorize or reject commercial quotations');
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      rfq: true,
      approvals: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!quotation) throw new NotFoundError('Quotation');

  if (quotation.status !== 'PENDING_APPROVAL') {
    throw new ConflictError(
      `Cannot process decision: Quotation is currently in ${quotation.status} status.`
    );
  }

  // STRICT ANTI-SELF-APPROVAL RULE (docs/SECURITY.md Section 6)
  if (quotation.createdBy === user.id) {
    throw new AuthorizationError(
      'Anti-Self-Approval Rule Violation: A user cannot approve a quotation they created. An independent Sales Head must approve this high-value quotation.'
    );
  }

  if (decision === 'REJECT' && (!comment || comment.trim().length < 3)) {
    throw new ValidationError('A comment explaining the commercial rejection is mandatory.');
  }

  const now = new Date();
  const nextStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const pendingApproval = quotation.approvals[0];

  const updatedQuotation = await prisma.$transaction(async (tx) => {
    // 1. Update quotation status and approver
    const quote = await tx.quotation.update({
      where: { id: quotationId },
      data: {
        status: nextStatus,
        approvedBy: decision === 'APPROVE' ? user.id : null,
      },
    });

    // 2. Update or create the approval audit record
    if (pendingApproval) {
      await tx.approval.update({
        where: { id: pendingApproval.id },
        data: {
          status: nextStatus,
          approverId: user.id,
          actionAt: now,
          comment: comment || (decision === 'APPROVE' ? 'Commercial pricing authorized.' : 'Rejected.'),
        },
      });
    } else {
      await tx.approval.create({
        data: {
          quotationId,
          approverId: user.id,
          status: nextStatus,
          actionAt: now,
          comment: comment || 'Commercial decision recorded.',
        },
      });
    }

    // 3. System audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: `COMMERCIAL_${decision}`,
        entityType: 'QUOTATION',
        entityId: quotationId,
        newValues: {
          decision,
          status: nextStatus,
          annualContractValue: Number(quotation.annualContractValue),
          comment,
        },
      },
    });

    return quote;
  });

  return updatedQuotation;
}
