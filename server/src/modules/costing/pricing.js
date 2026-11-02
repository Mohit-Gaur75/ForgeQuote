// server/src/modules/costing/pricing.js
import Decimal from 'decimal.js';
import { BusinessRuleError } from '../../utils/errors.js';

/**
 * Deterministic commercial gross margin calculation.
 * Formula: sellingPrice = totalUnitCost / (1 - grossMarginPercentage / 100)
 * Rejects grossMarginPercentage >= 100%.
 *
 * @param {Decimal} totalUnitCost
 * @param {number|string|Decimal} grossMarginPercentage
 * @returns {Decimal} Selling price before GST
 */
export function calculateSellingPrice(totalUnitCost, grossMarginPercentage) {
  const margin = new Decimal(grossMarginPercentage);

  if (margin.gte(100)) {
    throw new BusinessRuleError('Gross margin percentage must be strictly less than 100%');
  }

  const marginFactor = new Decimal(1).minus(margin.dividedBy(100));
  return totalUnitCost.dividedBy(marginFactor);
}
