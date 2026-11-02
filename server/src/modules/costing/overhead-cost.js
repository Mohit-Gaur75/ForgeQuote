// server/src/modules/costing/overhead-cost.js
import Decimal from 'decimal.js';

/**
 * Deterministic factory overhead calculation.
 * Formula: overhead = (conversionCost + setupCost) * (overheadPercentage / 100)
 *
 * @param {Decimal} conversionCost
 * @param {Decimal} setupCost
 * @param {number|string|Decimal} overheadPercentage
 * @returns {Decimal}
 */
export function calculateOverheadCost(conversionCost, setupCost, overheadPercentage) {
  const pct = new Decimal(overheadPercentage || 0);
  const base = conversionCost.plus(setupCost);
  return base.times(pct.dividedBy(100));
}
