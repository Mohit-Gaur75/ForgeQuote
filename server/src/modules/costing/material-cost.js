// server/src/modules/costing/material-cost.js
import Decimal from 'decimal.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Deterministic raw material cost calculation.
 * If gross weight is supplied, uses it directly.
 * Otherwise, derives: grossWeight = netWeight / (1 - scrapPercentage / 100).
 *
 * @param {number|string|Decimal} netWeight
 * @param {number|string|Decimal|null} grossWeight
 * @param {number|string|Decimal} scrapPercentage
 * @param {number|string|Decimal} materialRate
 * @returns {{ materialCost: Decimal, grossWeight: Decimal, isDerived: boolean }}
 */
export function calculateMaterialCost(netWeight, grossWeight, scrapPercentage, materialRate) {
  const net = new Decimal(netWeight);
  const scrap = new Decimal(scrapPercentage || 0);
  const rate = new Decimal(materialRate);

  if (scrap.gte(100)) {
    throw new ValidationError('Scrap percentage must be strictly less than 100%');
  }

  let finalGross;
  let isDerived = false;

  if (grossWeight !== null && grossWeight !== undefined && grossWeight !== '') {
    finalGross = new Decimal(grossWeight);
    if (finalGross.lt(net)) {
      throw new ValidationError('Gross weight cannot be less than net weight');
    }
  } else {
    // Gross weight derivation formula: net / (1 - scrap / 100)
    const scrapFactor = new Decimal(1).minus(scrap.dividedBy(100));
    finalGross = net.dividedBy(scrapFactor);
    isDerived = true;
  }

  const materialCost = finalGross.times(rate);

  return {
    materialCost,
    grossWeight: finalGross,
    isDerived,
  };
}
