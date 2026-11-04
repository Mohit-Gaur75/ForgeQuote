// server/tests/unit/routings/similarity.test.js
import { describe, it, expect } from 'vitest';
import {
  calculateNameSimilarity,
  calculateMaterialSimilarity,
  calculateWeightSimilarity,
  calculatePartSimilarity,
} from '../../../src/modules/routings/similarity.js';

describe('Deterministic Routing Similarity Engine', () => {
  it('calculateNameSimilarity - returns 1.0 for identical names', () => {
    expect(calculateNameSimilarity('Wheel Spindle', 'Wheel Spindle')).toBe(1.0);
    expect(calculateNameSimilarity('gear blank', 'GEAR BLANK')).toBe(1.0);
  });

  it('calculateNameSimilarity - calculates Jaccard token overlap on related parts', () => {
    const score = calculateNameSimilarity('Front Wheel Spindle', 'Rear Wheel Spindle');
    expect(score).toBeGreaterThanOrEqual(0.5);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('calculateNameSimilarity - returns 0.0 for completely disjoint part names', () => {
    const score = calculateNameSimilarity('Exhaust Manifold Nozzle', 'Pinion Gear Shaft');
    expect(score).toBe(0.0);
  });

  it('calculateMaterialSimilarity - handles exact match (1.0), family (0.6), and unrelated (0.0)', () => {
    expect(calculateMaterialSimilarity('EN8', 'EN8')).toBe(1.0);
    expect(calculateMaterialSimilarity('EN8', 'en8')).toBe(1.0);

    // Same family: Alloy steels (40Cr4 and 20MnCr5)
    expect(calculateMaterialSimilarity('40Cr4', '20MnCr5')).toBe(0.6);

    // Unrelated: Carbon steel vs Stainless steel
    expect(calculateMaterialSimilarity('EN8', 'SS304')).toBe(0.0);
  });

  it('calculateWeightSimilarity - scales strictly with net weight disparity', () => {
    expect(calculateWeightSimilarity(1.0, 1.0)).toBe(1.0);
    expect(calculateWeightSimilarity(0.8, 1.0)).toBeCloseTo(0.8, 2);
    expect(calculateWeightSimilarity(0.5, 5.0)).toBeCloseTo(0.1, 2);
    expect(calculateWeightSimilarity(0, 1.0)).toBe(0.0);
  });

  it('calculatePartSimilarity - computes weighted composite score (0.4 name + 0.35 mat + 0.25 weight)', () => {
    const partA = {
      partName: 'Front Wheel Spindle',
      material: 'EN8',
      netWeightKg: 0.68,
    };

    const partB = {
      partName: 'Rear Wheel Spindle Stub',
      material: 'EN8',
      netWeightKg: 0.72,
    };

    const result = calculatePartSimilarity(partA, partB);

    expect(result.score).toBeGreaterThan(0.7);
    expect(result.breakdown.material).toBe(1.0);
    expect(result.breakdown.name).toBeGreaterThanOrEqual(0.4);
    expect(result.breakdown.weight).toBeGreaterThan(0.9);
  });
});
