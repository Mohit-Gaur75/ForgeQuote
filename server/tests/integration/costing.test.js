// server/tests/integration/costing.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Costing API Integration Tests (/api/v1/costing)', () => {
  let estimatorCookie;
  let partA;

  beforeAll(async () => {
    await prisma.$connect();

    const estRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'estimator@forgequote.demo', password: 'Estimator@123' });
    estimatorCookie = estRes.headers['set-cookie'];

    // Find part A (Spindle)
    partA = await prisma.part.findFirst({
      where: { partNumber: 'SP-001' },
      include: { operations: true },
    });
  });

  it('POST /parts/:id/calculate - calculates Part A Spindle cost matching ₹149.56 benchmark', async () => {
    const res = await request(app)
      .post(`/api/v1/parts/${partA.id}/calculate`)
      .set('Cookie', estimatorCookie)
      .send({
        netWeightKg: 0.61,
        scrapPercentage: 5.0,
        materialRatePerKg: 85.0,
        annualVolume: 180000,
        overheadPercentage: 4.0,
        packingPerUnit: 4.00,
        freightPerUnit: 2.00,
        grossMarginPercentage: 15.0,
        gstPercentage: 18.0,
        operations: [
          {
            operationSequence: 10,
            operationName: 'CNC Rough & Finish Turning',
            machineType: 'CNC Lathe',
            cycleTimeMinutes: 3.2,
            machineHourRate: 850.0,
            setupHours: 2.0,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const calc = res.body.data;
    expect(calc.tiers).toBeDefined();
    expect(calc.tiers.length).toBe(3);

    const tier100 = calc.tiers[1];
    expect(tier100.tierName).toBe('100% Volume (Baseline)');
    expect(tier100.materialCost).toBeCloseTo(54.58, 1);
    expect(tier100.conversionCost).toBeCloseTo(45.33, 1);
    expect(tier100.setupCost).toBeCloseTo(0.01, 2);
    expect(tier100.overheadCost).toBeCloseTo(1.81, 1);
    expect(tier100.totalUnitCost).toBeCloseTo(107.74, 1);
    expect(tier100.sellingPriceBeforeGST).toBeCloseTo(126.75, 1);
    expect(tier100.gstAmount).toBeCloseTo(22.82, 1);
    expect(tier100.finalPrice).toBeCloseTo(149.56, 1);
  });

  it('POST /parts/:id/save-costing - updates part costing, operations, and status', async () => {
    const res = await request(app)
      .post(`/api/v1/parts/${partA.id}/save-costing`)
      .set('Cookie', estimatorCookie)
      .send({
        netWeightKg: 0.72,
        grossWeightKg: 0.85,
        scrapPercentage: 15.2941176,
        materialRatePerKg: 64.2117647,
        annualVolume: 12000,
        overheadPercentage: 4.0,
        packingPerUnit: 4.00,
        freightPerUnit: 2.00,
        grossMarginPercentage: 15.0,
        gstPercentage: 18.0,
        operations: [
          {
            operationSequence: 10,
            operationName: 'Facing & Centering',
            machineType: 'CNC Lathe',
            cycleTimeMinutes: 0.75,
            machineHourRate: 450,
            setupHours: 0.5,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Check DB part updates
    const updatedPart = await prisma.part.findUnique({
      where: { id: partA.id },
      include: { operations: true },
    });
    expect(Number(updatedPart.netWeightKg)).toBe(0.72);
    expect(Number(updatedPart.grossWeightKg)).toBe(0.85);
    expect(updatedPart.operations.length).toBe(1);
    expect(updatedPart.operations[0].operationName).toBe('Facing & Centering');
  });
});
