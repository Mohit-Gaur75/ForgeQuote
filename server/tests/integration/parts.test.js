import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Parts API Integration Tests (/api/v1/parts)', () => {
  let estimatorCookie;
  let salesCookie;
  let targetRfqId;
  let createdPartId;

  beforeAll(async () => {
    await prisma.$connect();

    // Login as Estimator
    const estRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'estimator@forgequote.demo', password: 'Estimator@123' });
    estimatorCookie = estRes.headers['set-cookie'];

    // Login as Sales Head
    const salesRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sales@forgequote.demo', password: 'Sales@123' });
    salesCookie = salesRes.headers['set-cookie'];

    const rfq = await prisma.rFQ.findFirst({ where: { rfqNumber: 'RFQ-2026-0001' } });
    targetRfqId = rfq.id;
  });

  it('POST /rfqs/:rfqId/parts - Estimator can add part to owned RFQ', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/parts`)
      .set('Cookie', estimatorCookie)
      .send({
        partNumber: 'TST-001',
        partName: 'Transmission Output Flange',
        material: '20MnCr5',
        netWeightKg: 1.5,
        scrapPercentage: 6.0,
        annualVolume: 50000,
        setupHours: 2.5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.partName).toBe('Transmission Output Flange');
    // Derived gross weight = 1.5 / (1 - 0.06) = 1.5957
    expect(Number(res.body.data.grossWeightKg)).toBeCloseTo(1.5957, 3);
    createdPartId = res.body.data.id;
  });

  it('POST /rfqs/:rfqId/parts - rejects gross weight less than net weight', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/parts`)
      .set('Cookie', estimatorCookie)
      .send({
        partName: 'Invalid Weight Part',
        netWeightKg: 2.0,
        grossWeightKg: 1.5, // Invalid: gross < net
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /rfqs/:rfqId/parts - Sales Head cannot create parts (Estimator only)', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/parts`)
      .set('Cookie', salesCookie)
      .send({
        partName: 'Unauthorized Part',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /parts/:id - retrieves part details with operations', async () => {
    const res = await request(app)
      .get(`/api/v1/parts/${createdPartId}`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdPartId);
    expect(res.body.data.rfq).toBeDefined();
  });

  it('PATCH /parts/:id - Estimator can update part parameters', async () => {
    const res = await request(app)
      .patch(`/api/v1/parts/${createdPartId}`)
      .set('Cookie', estimatorCookie)
      .send({
        annualVolume: 65000,
        material: 'EN8',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.annualVolume).toBe(65000);
    expect(res.body.data.material).toBe('EN8');
  });

  it('DELETE /parts/:id - Estimator can delete part', async () => {
    const res = await request(app)
      .delete(`/api/v1/parts/${createdPartId}`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get(`/api/v1/parts/${createdPartId}`)
      .set('Cookie', estimatorCookie);
    expect(checkRes.status).toBe(404);
  });
});
