// server/src/modules/costing/setup-cost.js
import Decimal from 'decimal.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Deterministic setup cost amortisation across quoted annual volume.
 * Formula: setupCost = (setupHours * machineHourRate) / quotedAnnualVolume
 *
 * @param {Array} operations
 * @param {number|string|Decimal} partSetupHours
 * @param {number|string|Decimal} annualVolume
 * @returns {Decimal} Total setup cost per unit
 */
export function calculateSetupCost(operations = [], partSetupHours = 0, annualVolume) {
  const volume = new Decimal(annualVolume);
  if (volume.lte(0)) {
    throw new ValidationError('Annual volume must be greater than zero for setup amortisation');
  }

  let totalSetupCost = new Decimal(0);
  let hasOpLevelSetup = false;

  // 1. Check if per-operation setup hours are configured
  for (const op of operations) {
    if (op.setupHours && new Decimal(op.setupHours).gt(0)) {
      hasOpLevelSetup = true;
      const hours = new Decimal(op.setupHours);
      const rate = new Decimal(op.machineHourRate || 0);
      const opSetupCost = hours.times(rate).dividedBy(volume);
      totalSetupCost = totalSetupCost.plus(opSetupCost);
    }
  }

  // 2. If no operation-level setup was defined, use part-level setup hours with primary operation rate
  if (!hasOpLevelSetup && partSetupHours && new Decimal(partSetupHours).gt(0)) {
    const hours = new Decimal(partSetupHours);
    const primaryRate = operations.length > 0 ? new Decimal(operations[0].machineHourRate || 0) : new Decimal(0);
    totalSetupCost = hours.times(primaryRate).dividedBy(volume);
  }

  return totalSetupCost;
}
