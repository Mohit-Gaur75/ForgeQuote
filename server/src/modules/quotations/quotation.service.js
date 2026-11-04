// server/src/modules/quotations/quotation.service.js
import Decimal from 'decimal.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { calculateComponentCosting } from '../costing/costing.service.js';
import {
  NotFoundError,
  AuthorizationError,
  ValidationError,
  ConflictError,
} from '../../utils/errors.js';

/**
 * Generate sequential quotation number: QUOTE-YYYY-NNNN
 * @param {object} tx - Prisma transaction client
 * @returns {Promise<string>}
 */
async function generateNextQuotationNumber(tx) {
  const year = new Date().getFullYear();
  const prefix = `QUOTE-${year}-`;

  const latestQuote = await tx.quotation.findFirst({
    where: {
      quotationNumber: { startsWith: prefix },
    },
    orderBy: { quotationNumber: 'desc' },
    select: { quotationNumber: true },
  });

  let nextSeq = 1;
  if (latestQuote) {
    const parts = latestQuote.quotationNumber.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSeq = currentSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Format Decimal to 2 decimal places with HALF_UP
 */
function to2Dec(d) {
  return Number(new Decimal(d).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
}

/**
 * Create a formal Quotation for an RFQ
 */
export async function createQuotation(user, rfqId, data) {
  // 1. Fetch RFQ and check ownership
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      parts: {
        include: {
          operations: { orderBy: { operationSequence: 'asc' } },
        },
      },
    },
  });

  if (!rfq) throw new NotFoundError('RFQ');

  if (user.role === 'ESTIMATOR' && rfq.ownerId !== user.id) {
    throw new AuthorizationError('You can only quote RFQs assigned to you');
  }

  // 2. Filter parts to include in quotation
  let partsToQuote = rfq.parts;
  if (data.partIds && data.partIds.length > 0) {
    partsToQuote = rfq.parts.filter((p) => data.partIds.includes(p.id));
  }

  if (partsToQuote.length === 0) {
    throw new ValidationError('No parts selected for quotation');
  }

  // Verify all parts have weights and at least one operation
  for (const part of partsToQuote) {
    if (!part.netWeightKg || Number(part.netWeightKg) <= 0) {
      throw new ValidationError(`Part ${part.partNumber || part.partName} is missing net weight.`);
    }
    if (!part.operations || part.operations.length === 0) {
      throw new ValidationError(
        `Part ${part.partNumber || part.partName} has no manufacturing operations configured.`
      );
    }
  }

  // 3. Fetch currently effective Rate Masters to lock in snapshot
  const now = new Date();
  const effectiveRates = await prisma.rateMaster.findMany({
    where: {
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
  });

  // Fallback defaults for rates by category
  const materialRateMap = new Map();
  for (const r of effectiveRates) {
    if (r.rateType === 'MATERIAL') {
      if (r.materialGrade) materialRateMap.set(r.materialGrade.toLowerCase(), Number(r.rateValue));
      materialRateMap.set(r.rateName.toLowerCase(), Number(r.rateValue));
    }
  }

  const marginPct = data.marginPercentage ?? 15.0;
  const gstPct = data.gstPercentage ?? 18.0;

  // 4. Run deterministic calculations for each part
  const partCalculations = [];
  let totalContractValue = new Decimal(0);
  let totalGstAmount = new Decimal(0);
  let totalSubtotalBeforeTax = new Decimal(0);

  for (const part of partsToQuote) {
    // Determine material rate from active master rates or fallback
    let matRate = 85.0;
    if (part.material) {
      const found = materialRateMap.get(part.material.toLowerCase());
      if (found) matRate = found;
    }

    const calcInput = {
      netWeightKg: Number(part.netWeightKg),
      grossWeightKg: part.grossWeightKg ? Number(part.grossWeightKg) : null,
      scrapPercentage: part.scrapPercentage ? Number(part.scrapPercentage) : 5.0,
      materialRatePerKg: matRate,
      operations: part.operations.map((op) => ({
        operationSequence: op.operationSequence,
        operationName: op.operationName,
        machineType: op.machineType,
        cycleTimeMinutes: Number(op.cycleTimeMinutes),
        machineHourRate: Number(op.machineHourRate),
        setupHours: op.setupHours ? Number(op.setupHours) : 0,
        machineRateVersionId: op.machineRateVersionId,
      })),
      annualVolume: part.annualVolume || 10000,
      partSetupHours: part.setupHours ? Number(part.setupHours) : 0,
      overheadPercentage: 4.0,
      packingPerUnit: 4.0,
      freightPerUnit: 2.0,
      grossMarginPercentage: marginPct,
      gstPercentage: gstPct,
    };

    const calc = calculateComponentCosting(calcInput);
    const baseline = calc.tiers[1] || calc.tiers[0];

    partCalculations.push({
      part,
      calc,
      baseline,
    });

    const baselinePrice = new Decimal(baseline.sellingPriceBeforeGST);
    const baselineContractVal = new Decimal(baseline.annualContractValue);
    const baselineGst = new Decimal(baseline.gstAmount);

    totalSubtotalBeforeTax = totalSubtotalBeforeTax.plus(baselinePrice);
    totalContractValue = totalContractValue.plus(baselineContractVal);
    totalGstAmount = totalGstAmount.plus(baselineGst.times(baseline.annualVolume));
  }

  const totalIncludingGST = totalContractValue.plus(totalGstAmount);

  // 5. Commercial Approval Rule: Check ₹25 Lakh threshold
  const requiresCommercialApproval = totalContractValue.gte(env.APPROVAL_THRESHOLD);
  const initialStatus = requiresCommercialApproval ? 'PENDING_APPROVAL' : 'DRAFT';

  // 6. Execute atomic creation inside a Prisma transaction
  const quotation = await prisma.$transaction(async (tx) => {
    const quotationNumber = await generateNextQuotationNumber(tx);

    // Create Quotation Record
    const createdQuote = await tx.quotation.create({
      data: {
        rfqId,
        quotationNumber,
        versionNumber: 1,
        status: initialStatus,
        subtotalBeforeTax: to2Dec(totalSubtotalBeforeTax),
        annualContractValue: to2Dec(totalContractValue),
        marginPercentage: marginPct,
        gstPercentage: gstPct,
        gstAmount: to2Dec(totalGstAmount),
        totalIncludingGST: to2Dec(totalIncludingGST),
        calculationVersion: '1.0',
        createdBy: user.id,
        calculationSnapshot: {
          partCount: partsToQuote.length,
          requiresCommercialApproval,
          approvalThreshold: env.APPROVAL_THRESHOLD,
          customNotes: data.customNotes || null,
        },
      },
    });

    // Create QuotationPart and QuotationTier records
    for (const item of partCalculations) {
      const qPart = await tx.quotationPart.create({
        data: {
          quotationId: createdQuote.id,
          partId: item.part.id,
          quotedAnnualVolume: item.baseline.annualVolume,
          materialCost: item.baseline.materialCost,
          conversionCost: item.baseline.conversionCost,
          setupCost: item.baseline.setupCost,
          overheadCost: item.baseline.overheadCost,
          packingCost: item.baseline.packingCost,
          freightCost: item.baseline.freightCost,
          totalCostPerUnit: item.baseline.totalUnitCost,
          marginPercentage: marginPct,
          sellingPriceBeforeGST: item.baseline.sellingPriceBeforeGST,
          gstAmountPerUnit: item.baseline.gstAmount,
          sellingPriceIncludingGST: item.baseline.finalPrice,
        },
      });

      // Insert 3 volume tiers
      for (const tier of item.calc.tiers) {
        await tx.quotationTier.create({
          data: {
            quotationPartId: qPart.id,
            annualVolume: tier.annualVolume,
            materialCost: tier.materialCost,
            conversionCost: tier.conversionCost,
            setupCost: tier.setupCost,
            overheadCost: tier.overheadCost,
            packingCost: tier.packingCost,
            freightCost: tier.freightCost,
            totalCostPerUnit: tier.totalUnitCost,
            sellingPriceBeforeGST: tier.sellingPriceBeforeGST,
            gstAmount: tier.gstAmount,
            sellingPriceIncludingGST: tier.finalPrice,
          },
        });
      }
    }

    // Lock effective Rate Masters into immutable snapshots
    for (const rate of effectiveRates) {
      await tx.quotationRateSnapshot.create({
        data: {
          quotationId: createdQuote.id,
          rateMasterId: rate.id,
          rateType: rate.rateType,
          versionNumber: rate.versionNumber,
          rateValue: rate.rateValue,
          unit: rate.unit,
          effectiveFrom: rate.effectiveFrom,
          effectiveTo: rate.effectiveTo,
        },
      });
    }

    // If commercial approval is required, create the pending approval record
    if (requiresCommercialApproval) {
      await tx.approval.create({
        data: {
          quotationId: createdQuote.id,
          approverId: user.id, // placeholder until claimed by Sales Head
          status: 'PENDING',
          comment: `Automatic trigger: Total annual contract value ${to2Dec(
            totalContractValue
          )} INR exceeds 25 Lakh threshold.`,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_QUOTATION',
        entityType: 'QUOTATION',
        entityId: createdQuote.id,
        newValues: {
          quotationNumber,
          status: initialStatus,
          annualContractValue: to2Dec(totalContractValue),
          requiresCommercialApproval,
        },
      },
    });

    return createdQuote;
  });

  return getQuotationById(user, quotation.id);
}

/**
 * Get quotation by ID with relations
 */
export async function getQuotationById(user, quotationId) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      rfq: {
        include: {
          owner: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      creator: { select: { id: true, name: true, email: true, role: true } },
      approver: { select: { id: true, name: true, email: true, role: true } },
      parts: {
        include: {
          part: true,
          tiers: { orderBy: { annualVolume: 'asc' } },
        },
      },
      rateSnapshots: {
        orderBy: [{ rateType: 'asc' }, { versionNumber: 'desc' }],
      },
      approvals: {
        orderBy: { createdAt: 'desc' },
        include: {
          approver: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  if (!quotation) throw new NotFoundError('Quotation');

  // Authorization: Estimators can only view their own RFQ quotes
  if (user.role === 'ESTIMATOR' && quotation.rfq.ownerId !== user.id) {
    throw new AuthorizationError('Access denied to this quotation');
  }

  return quotation;
}

/**
 * Submit a draft quotation for approval or mark ready to send
 */
export async function submitQuotation(user, quotationId) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { rfq: true },
  });

  if (!quote) throw new NotFoundError('Quotation');
  if (user.role === 'ESTIMATOR' && quote.createdBy !== user.id) {
    throw new AuthorizationError('You can only submit quotations you created');
  }

  if (quote.status !== 'DRAFT') {
    throw new ConflictError(`Cannot submit quotation in ${quote.status} status`);
  }

  const contractVal = new Decimal(quote.annualContractValue || 0);
  const requiresApproval = contractVal.gte(env.APPROVAL_THRESHOLD);
  const nextStatus = requiresApproval ? 'PENDING_APPROVAL' : 'READY_TO_SEND';

  await prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: nextStatus },
    });

    if (requiresApproval) {
      await tx.approval.create({
        data: {
          quotationId,
          approverId: user.id,
          status: 'PENDING',
          comment: 'Submitted for Sales Head commercial review.',
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'SUBMIT_QUOTATION',
        entityType: 'QUOTATION',
        entityId: quotationId,
        newValues: { status: nextStatus },
      },
    });
  });

  return getQuotationById(user, quotationId);
}

/**
 * Simulate dispatching a quotation to customer
 */
export async function sendQuotation(user, quotationId, sendData = {}) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { rfq: true },
  });

  if (!quote) throw new NotFoundError('Quotation');

  // Commercial gate: Cannot send if awaiting approval or rejected
  if (quote.status === 'PENDING_APPROVAL') {
    throw new ValidationError(
      'Cannot send quotation: Commercial approval by Sales Head is pending (&ge; ₹25 Lakh threshold).'
    );
  }

  if (quote.status === 'REJECTED') {
    throw new ValidationError('Cannot send quotation: Quotation was rejected during commercial review.');
  }

  if (quote.status === 'SENT') {
    throw new ConflictError('Quotation has already been sent to customer.');
  }

  const sentAt = new Date();

  await prisma.$transaction(async (tx) => {
    // Update quotation status
    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'SENT' },
    });

    // Update RFQ status to SENT
    await tx.rFQ.update({
      where: { id: quote.rfqId },
      data: { status: 'SENT' },
    });

    // Write audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'SEND_QUOTATION_SIMULATION',
        entityType: 'QUOTATION',
        entityId: quotationId,
        newValues: {
          status: 'SENT',
          sentAt: sentAt.toISOString(),
          customerName: quote.rfq.customerName,
          recipientEmail: sendData.recipientEmail || 'procurement@customer.demo',
          simulated: true,
        },
      },
    });
  });

  return {
    simulated: true,
    message: 'Quotation successfully dispatched to customer (Simulation).',
    quotationNumber: quote.quotationNumber,
    customerName: quote.rfq.customerName,
    recipientEmail: sendData.recipientEmail || 'procurement@customer.demo',
    sentAt: sentAt.toISOString(),
    annualContractValue: Number(quote.annualContractValue),
  };
}
