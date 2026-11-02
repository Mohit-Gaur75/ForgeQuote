// server/src/modules/costing/costing.service.js
import Decimal from 'decimal.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { calculateMaterialCost } from './material-cost.js';
import { calculateConversionCost } from './conversion-cost.js';
import { calculateSetupCost } from './setup-cost.js';
import { calculateOverheadCost } from './overhead-cost.js';
import { calculateSellingPrice } from './pricing.js';
import { calculateGST } from './gst.js';
import {
  CALCULATION_VERSION,
  DEFAULT_VOLUME_TIER_MULTIPLIERS,
} from './costing.constants.js';
import { NotFoundError, AuthorizationError } from '../../utils/errors.js';

/**
 * Format a Decimal instance to 2 decimal places with HALF_UP rounding for presentation.
 * @param {Decimal} d
 * @returns {number}
 */
function to2Dec(d) {
  return Number(d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
}

/**
 * Pure calculation function: calculates complete multi-tier costing breakdown without DB side-effects.
 * @param {object} input
 * @returns {object}
 */
export function calculateComponentCosting(input) {
  const {
    netWeightKg,
    grossWeightKg,
    scrapPercentage = 5.0,
    materialRatePerKg,
    operations = [],
    partSetupHours = 0,
    annualVolume,
    overheadPercentage = 4.0,
    packingPerUnit = 0,
    freightPerUnit = 0,
    grossMarginPercentage = 15.0,
    gstPercentage = 18.0,
    tierVolumes,
  } = input;

  // 1. Material Cost (Constant per unit across tiers)
  const matResult = calculateMaterialCost(netWeightKg, grossWeightKg, scrapPercentage, materialRatePerKg);
  const materialCost = matResult.materialCost;
  const grossWeight = matResult.grossWeight;

  // 2. Conversion Cost (Constant per unit across tiers)
  const convResult = calculateConversionCost(operations);
  const conversionCost = convResult.totalConversionCost;

  // 3. Logistics (Constant per unit across tiers)
  const packingCost = new Decimal(packingPerUnit || 0);
  const freightCost = new Decimal(freightPerUnit || 0);

  // 4. Determine Volume Tiers (Default: 50%, 100%, 150%)
  const baseVolume = new Decimal(annualVolume);
  const volumes = tierVolumes && tierVolumes.length === 3
    ? tierVolumes.map(v => new Decimal(v))
    : DEFAULT_VOLUME_TIER_MULTIPLIERS.map(m => baseVolume.times(m.multiplier).round());

  const tiers = volumes.map((tierVol, idx) => {
    const tierName = DEFAULT_VOLUME_TIER_MULTIPLIERS[idx]?.tierName || `Tier ${idx + 1}`;

    // Recalculate Setup amortisation specifically for this tier's volume
    const setupCost = calculateSetupCost(operations, partSetupHours, tierVol);

    // Factory Overhead: (Conversion + Setup) * overhead%
    const overheadCost = calculateOverheadCost(conversionCost, setupCost, overheadPercentage);

    // Total Unit Cost
    const totalUnitCost = materialCost
      .plus(conversionCost)
      .plus(setupCost)
      .plus(overheadCost)
      .plus(packingCost)
      .plus(freightCost);

    // Selling Price Before GST: Total / (1 - Margin/100)
    const sellingPriceBeforeGST = calculateSellingPrice(totalUnitCost, grossMarginPercentage);

    // GST & Final Unit Price
    const gstResult = calculateGST(sellingPriceBeforeGST, gstPercentage);
    const gstAmount = gstResult.gstAmount;
    const finalPrice = gstResult.finalPrice;

    // Annual Contract Value for this tier (pre-GST)
    const annualContractValue = sellingPriceBeforeGST.times(tierVol);

    return {
      tierIndex: idx,
      tierName,
      annualVolume: Number(tierVol.toString()),
      materialCost: to2Dec(materialCost),
      conversionCost: to2Dec(conversionCost),
      setupCost: to2Dec(setupCost),
      overheadCost: to2Dec(overheadCost),
      packingCost: to2Dec(packingCost),
      freightCost: to2Dec(freightCost),
      totalUnitCost: to2Dec(totalUnitCost),
      sellingPriceBeforeGST: to2Dec(sellingPriceBeforeGST),
      gstAmount: to2Dec(gstAmount),
      finalPrice: to2Dec(finalPrice),
      annualContractValue: to2Dec(annualContractValue),
      // Raw Decimals for exact persistence in transactions
      _raw: {
        materialCost,
        conversionCost,
        setupCost,
        overheadCost,
        packingCost,
        freightCost,
        totalUnitCost,
        sellingPriceBeforeGST,
        gstAmount,
        finalPrice,
        annualContractValue,
      },
    };
  });

  // Base tier is index 1 (100% volume tier)
  const baseline = tiers[1] || tiers[0];
  const requiresCommercialApproval = baseline.annualContractValue >= env.APPROVAL_THRESHOLD;

  return {
    calculationVersion: CALCULATION_VERSION,
    grossWeightKg: Number(grossWeight.toFixed(4)),
    isGrossWeightDerived: matResult.isDerived,
    summary: {
      materialCost: baseline.materialCost,
      conversionCost: baseline.conversionCost,
      setupCost: baseline.setupCost,
      overheadCost: baseline.overheadCost,
      packingCost: baseline.packingCost,
      freightCost: baseline.freightCost,
      totalUnitCost: baseline.totalUnitCost,
      sellingPriceBeforeGST: baseline.sellingPriceBeforeGST,
      gstAmount: baseline.gstAmount,
      finalPrice: baseline.finalPrice,
      annualContractValue: baseline.annualContractValue,
      requiresCommercialApproval,
    },
    operationsBreakdown: convResult.operationsBreakdown.map(op => ({
      sequence: op.operationSequence,
      name: op.operationName,
      machineType: op.machineType,
      cycleTimeMinutes: to2Dec(op.cycleTimeMinutes),
      machineHourRate: to2Dec(op.machineHourRate),
      operationCost: to2Dec(op.operationCost),
    })),
    tiers: tiers.map(({ _raw, ...rest }) => rest),
    _rawTiers: tiers.map(t => t._raw),
  };
}

export async function savePartCosting(user, partId, costingData) {
  const part = await prisma.part.findUnique({
    where: { id: partId },
    include: { rfq: true },
  });

  if (!part) throw new NotFoundError('Part');
  if (user.role === 'ESTIMATOR' && part.rfq.ownerId !== user.id) {
    throw new AuthorizationError('You cannot configure costing for a part on an RFQ you do not own');
  }

  // Calculate full mathematical breakdown
  const calculation = calculateComponentCosting(costingData);

  // Atomically update part parameters & replace operations in DB
  await prisma.$transaction(async (tx) => {
    // 1. Delete existing operations
    await tx.partOperation.deleteMany({ where: { partId } });

    // 2. Insert new operations
    if (costingData.operations && costingData.operations.length > 0) {
      await tx.partOperation.createMany({
        data: costingData.operations.map((op, idx) => ({
          partId,
          operationSequence: op.operationSequence || idx + 1,
          operationName: op.operationName,
          machineType: op.machineType,
          cycleTimeMinutes: op.cycleTimeMinutes,
          machineHourRate: op.machineHourRate,
          machineRateVersionId: op.machineRateVersionId || null,
          setupHours: op.setupHours || 0,
        })),
      });
    }

    // 3. Update Part record weights, volume and setup hours
    await tx.part.update({
      where: { id: partId },
      data: {
        grossWeightKg: calculation.grossWeightKg,
        netWeightKg: costingData.netWeightKg,
        scrapPercentage: costingData.scrapPercentage,
        annualVolume: costingData.annualVolume,
        setupHours: costingData.partSetupHours || 0,
      },
    });

    // 4. Audit Log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'SAVE_PART_COSTING',
        entityType: 'PART',
        entityId: partId,
        newValues: {
          sellingPriceBeforeGST: calculation.summary.sellingPriceBeforeGST,
          finalPrice: calculation.summary.finalPrice,
        },
      },
    });
  });

  return calculation;
}

export async function getPartCosting(user, partId) {
  const part = await prisma.part.findUnique({
    where: { id: partId },
    include: {
      operations: { orderBy: { operationSequence: 'asc' } },
      rfq: true,
    },
  });

  if (!part) throw new NotFoundError('Part');
  if (user.role === 'ESTIMATOR' && part.rfq.ownerId !== user.id) {
    throw new AuthorizationError('Access denied to this part');
  }

  // Fallback defaults or part's existing values
  const operations = part.operations.map(op => ({
    operationSequence: op.operationSequence,
    operationName: op.operationName,
    machineType: op.machineType,
    cycleTimeMinutes: Number(op.cycleTimeMinutes),
    machineHourRate: Number(op.machineHourRate),
    setupHours: op.setupHours ? Number(op.setupHours) : 0,
    machineRateVersionId: op.machineRateVersionId,
  }));

  // Resolve active material rate if material is set
  let materialRate = 85.0;
  if (part.material) {
    const rate = await prisma.rateMaster.findFirst({
      where: {
        rateType: 'MATERIAL',
        materialGrade: part.material,
        isActive: true,
      },
      orderBy: { versionNumber: 'desc' },
    });
    if (rate) materialRate = Number(rate.rateValue);
  }

  if (operations.length === 0) {
    return {
      part,
      calculated: null,
    };
  }

  const calculation = calculateComponentCosting({
    netWeightKg: Number(part.netWeightKg || 0.61),
    grossWeightKg: part.grossWeightKg ? Number(part.grossWeightKg) : null,
    scrapPercentage: part.scrapPercentage ? Number(part.scrapPercentage) : 5.0,
    materialRatePerKg: materialRate,
    operations,
    partSetupHours: part.setupHours ? Number(part.setupHours) : 2.0,
    annualVolume: part.annualVolume || 100000,
    overheadPercentage: 4.0,
    packingPerUnit: 4.0,
    freightPerUnit: 2.0,
    grossMarginPercentage: 15.0,
    gstPercentage: 18.0,
  });

  return {
    part,
    calculated: calculation,
  };
}
