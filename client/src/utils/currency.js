// client/src/utils/currency.js
/**
 * Format a number into Indian currency format (e.g. ₹1,23,456.78)
 * @param {number|string} amount
 * @param {boolean} includeSymbol
 * @returns {string}
 */
export function formatINR(amount, includeSymbol = true) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format a number in Indian Lakhs / Crores for summary metrics
 * @param {number|string} amount
 * @returns {string}
 */
export function formatLakhCrore(amount) {
  if (!amount || isNaN(Number(amount))) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  return formatINR(num);
}
