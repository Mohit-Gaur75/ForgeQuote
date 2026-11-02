// server/src/modules/costing/conversion-cost.js
import Decimal from 'decimal.js';

/**
 * Deterministic conversion (machining) cost calculation.
 * For each operation: opCost = (cycleTimeMinutes / 60) * machineHourRate
 * Total = sum of all operation costs.
 *
 * @param {Array<{ cycleTimeMinutes: number|string, machineHourRate: number|string, operationName?: string }>} operations
 * @returns {{ totalConversionCost: Decimal, operationsBreakdown: Array }}
 */
export function calculateConversionCost(operations = []) {
  let totalConversionCost = new Decimal(0);
  const sixty = new Decimal(60);

  const operationsBreakdown = operations.map((op, idx) => {
    const cycleMin = new Decimal(op.cycleTimeMinutes || 0);
    const mhr = new Decimal(op.machineHourRate || 0);

    const hours = cycleMin.dividedBy(sixty);
    const opCost = hours.times(mhr);

    totalConversionCost = totalConversionCost.plus(opCost);

    return {
      operationSequence: op.operationSequence || idx + 1,
      operationName: op.operationName,
      machineType: op.machineType,
      cycleTimeMinutes: cycleMin,
      machineHourRate: mhr,
      hoursPerUnit: hours,
      operationCost: opCost,
    };
  });

  return {
    totalConversionCost,
    operationsBreakdown,
  };
}
