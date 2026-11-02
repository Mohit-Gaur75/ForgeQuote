// server/src/modules/costing/gst.js
import Decimal from 'decimal.js';

/**
 * Deterministic GST calculation.
 * Formula:
 * gstAmount = sellingPriceBeforeGST * (gstPercentage / 100)
 * finalPrice = sellingPriceBeforeGST + gstAmount
 *
 * @param {Decimal} sellingPriceBeforeGST
 * @param {number|string|Decimal} gstPercentage
 * @returns {{ gstAmount: Decimal, finalPrice: Decimal }}
 */
export function calculateGST(sellingPriceBeforeGST, gstPercentage = 18.0) {
  const gstPct = new Decimal(gstPercentage);
  const gstAmount = sellingPriceBeforeGST.times(gstPct.dividedBy(100));
  const finalPrice = sellingPriceBeforeGST.plus(gstAmount);

  return {
    gstAmount,
    finalPrice,
  };
}
