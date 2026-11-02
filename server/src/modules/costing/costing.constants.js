// server/src/modules/costing/costing.constants.js

export const CALCULATION_VERSION = '1.0';

export const DEFAULT_VOLUME_TIER_MULTIPLIERS = [
  { tierName: '50% Volume', multiplier: 0.5 },
  { tierName: '100% Volume (Baseline)', multiplier: 1.0 },
  { tierName: '150% Volume', multiplier: 1.5 },
];

export const DEFAULT_GST_PERCENTAGE = 18.0;
export const DEFAULT_GROSS_MARGIN_PERCENTAGE = 15.0;
export const DEFAULT_SCRAP_PERCENTAGE = 5.0;
export const DEFAULT_OVERHEAD_PERCENTAGE = 4.0;
