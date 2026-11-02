import { describe, it, expect } from 'vitest';
import { calculateComponentCosting } from '../../../src/modules/costing/costing.service.js';
import { calculateSellingPrice } from '../../../src/modules/costing/pricing.js';
import Decimal from 'decimal.js';

describe('Deterministic Costing Engine — Reference Parts Validation', () => {
  it('PART A: Rear wheel spindle matches expected industrial reference values', () => {
    const result = calculateComponentCosting({
      netWeightKg: 0.61,
      grossWeightKg: null, // derived from scrap
      scrapPercentage: 5.0,
      materialRatePerKg: 85.0,
      operations: [
        {
          operationName: 'CNC Rough & Finish Turning',
          machineType: 'CNC Lathe',
          cycleTimeMinutes: 3.2,
          machineHourRate: 850.0,
          setupHours: 2.0,
        },
      ],
      annualVolume: 180000,
      overheadPercentage: 4.0,
      packingPerUnit: 4.0,
      freightPerUnit: 2.0,
      grossMarginPercentage: 15.0,
      gstPercentage: 18.0,
    });

    const summary = result.summary;

    // Benchmark assertions (within 0.02 INR due to half-up presentation boundaries)
    expect(summary.materialCost).toBeCloseTo(54.58, 1);
    expect(summary.conversionCost).toBeCloseTo(45.33, 1);
    expect(summary.setupCost).toBeCloseTo(0.01, 2);
    expect(summary.overheadCost).toBeCloseTo(1.81, 1);
    expect(summary.packingCost).toBe(4.0);
    expect(summary.freightCost).toBe(2.0);
    expect(summary.totalUnitCost).toBeCloseTo(107.74, 1);
    expect(summary.sellingPriceBeforeGST).toBeCloseTo(126.75, 1);
    expect(summary.gstAmount).toBeCloseTo(22.82, 1);
    expect(summary.finalPrice).toBeCloseTo(149.56, 1);

    // Volume tiers: 50% (90,000), 100% (180,000), 150% (270,000)
    expect(result.tiers).toHaveLength(3);
    expect(result.tiers[0].annualVolume).toBe(90000);
    expect(result.tiers[1].annualVolume).toBe(180000);
    expect(result.tiers[2].annualVolume).toBe(270000);

    // Setup amortisation varies across tiers
    expect(result.tiers[0].setupCost).toBeGreaterThan(result.tiers[2].setupCost);
  });

  it('PART B: Hydraulic lift arm matches expected industrial reference values', () => {
    const result = calculateComponentCosting({
      netWeightKg: 4.60,
      grossWeightKg: 5.00, // gross provided directly
      scrapPercentage: 8.0,
      materialRatePerKg: 110.0,
      operations: [
        {
          operationName: '1600T Die Forging & Trimming',
          machineType: 'Forging Press 1600T',
          cycleTimeMinutes: 11.5,
          machineHourRate: 1450.0,
          setupHours: 4.0,
        },
      ],
      annualVolume: 24000,
      overheadPercentage: 8.0,
      packingPerUnit: 12.0,
      freightPerUnit: 6.0,
      grossMarginPercentage: 15.0,
      gstPercentage: 18.0,
    });

    const summary = result.summary;

    expect(summary.materialCost).toBeCloseTo(550.0, 1);
    expect(summary.conversionCost).toBeCloseTo(277.92, 1);
    expect(summary.setupCost).toBeCloseTo(0.24, 2);
    expect(summary.overheadCost).toBeCloseTo(22.25, 1);
    expect(summary.packingCost).toBe(12.0);
    expect(summary.freightCost).toBe(6.0);
    expect(summary.totalUnitCost).toBeCloseTo(868.41, 1);
    expect(summary.sellingPriceBeforeGST).toBeCloseTo(1021.66, 1);
    expect(summary.gstAmount).toBeCloseTo(183.9, 1);
    expect(summary.finalPrice).toBeCloseTo(1205.56, 1);
  });

  it('PART C: Gear blank matches expected industrial reference values', () => {
    const result = calculateComponentCosting({
      netWeightKg: 1.48,
      grossWeightKg: null,
      scrapPercentage: 6.0,
      materialRatePerKg: 125.0,
      operations: [
        {
          operationName: 'VMC Profile Machining',
          machineType: 'VMC 3-Axis',
          cycleTimeMinutes: 4.8,
          machineHourRate: 950.0,
          setupHours: 3.0,
        },
      ],
      annualVolume: 60000,
      overheadPercentage: 6.0,
      packingPerUnit: 7.0,
      freightPerUnit: 3.0,
      grossMarginPercentage: 15.0,
      gstPercentage: 18.0,
    });

    const summary = result.summary;

    expect(summary.materialCost).toBeCloseTo(196.81, 1);
    expect(summary.conversionCost).toBeCloseTo(76.0, 1);
    expect(summary.setupCost).toBeCloseTo(0.05, 2);
    expect(summary.overheadCost).toBeCloseTo(4.56, 1);
    expect(summary.packingCost).toBe(7.0);
    expect(summary.freightCost).toBe(3.0);
    expect(summary.totalUnitCost).toBeCloseTo(287.42, 1);
    expect(summary.sellingPriceBeforeGST).toBeCloseTo(338.14, 1);
    expect(summary.gstAmount).toBeCloseTo(60.87, 1);
    expect(summary.finalPrice).toBeCloseTo(399.01, 1);
  });

  it('Edge Case: Gross margin >= 100% throws BusinessRuleError', () => {
    expect(() => {
      calculateSellingPrice(new Decimal(100), 100);
    }).toThrow(/less than 100%/);

    expect(() => {
      calculateSellingPrice(new Decimal(100), 105);
    }).toThrow(/less than 100%/);
  });
});
