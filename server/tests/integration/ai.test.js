import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('AI Extraction API Integration Tests (/api/v1/rfqs/:id/extract)', () => {
  let estimatorCookie;
  let salesCookie;
  let targetRfqId;
  let extractionId;

  beforeAll(async () => {
    await prisma.$connect();

    const estRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'estimator@forgequote.demo', password: 'Estimator@123' });
    estimatorCookie = estRes.headers['set-cookie'];

    const salesRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sales@forgequote.demo', password: 'Sales@123' });
    salesCookie = salesRes.headers['set-cookie'];

    const rfq = await prisma.rFQ.findFirst({ where: { rfqNumber: 'RFQ-2026-0001' } });
    targetRfqId = rfq.id;
  });

  it('POST /rfqs/:id/extract - extracts structured part data with confidence and source excerpts', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/extract`)
      .set('Cookie', estimatorCookie)
      .send({
        emailText: 'Dear Estimator, Please quote for Rear wheel spindle in EN8 material. Quantity: 180,000 units/year. Target due date: 15-Nov-2026.',
        partListText: 'Item: Rear wheel spindle, Part No: SP-001, Finished Weight: 0.61 kg, Annual Vol: 180,000 pcs.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customerName.value).toBeDefined();
    expect(res.body.data.parts.length).toBeGreaterThan(0);

    const spindle = res.body.data.parts[0];
    expect(spindle.partName.value).toBe('Rear wheel spindle');
    expect(spindle.material.value).toBe('EN8');
    expect(spindle.netWeightKg.value).toBe(0.61);
    expect(spindle.annualVolume.value).toBe(180000);

    // Verify confidence scores and source excerpts exist
    expect(spindle.partName.confidence).toBeGreaterThanOrEqual(0.9);
    expect(spindle.partName.sourceText).toBeDefined();

    extractionId = res.body.data.extractionId;
    expect(extractionId).toBeDefined();
  });

  it('POST /rfqs/:id/extract - deduplication returns cached result on identical input', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/extract`)
      .set('Cookie', estimatorCookie)
      .send({
        emailText: 'Dear Estimator, Please quote for Rear wheel spindle in EN8 material. Quantity: 180,000 units/year. Target due date: 15-Nov-2026.',
        partListText: 'Item: Rear wheel spindle, Part No: SP-001, Finished Weight: 0.61 kg, Annual Vol: 180,000 pcs.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.cached).toBe(true);
    expect(res.body.data.extractionId).toBe(extractionId);
  });

  it('POST /rfqs/:id/extract - rejects empty input with 400 validation error', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/extract`)
      .set('Cookie', estimatorCookie)
      .send({
        emailText: '',
        partListText: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /rfqs/:id/extract - forbids Sales Head from triggering extraction (Estimator only)', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/extract`)
      .set('Cookie', salesCookie)
      .send({
        emailText: 'Sample email text',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /rfqs/:id/extractions - lists stored extractions for the RFQ', async () => {
    const res = await request(app)
      .get(`/api/v1/rfqs/${targetRfqId}/extractions`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].id).toBe(extractionId);
  });

  it('POST /rfqs/:id/extractions/:extractionId/confirm - commits verified parts to database', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${targetRfqId}/extractions/${extractionId}/confirm`)
      .set('Cookie', estimatorCookie)
      .send({
        confirmedCustomerName: 'Bajaj Auto Ltd (Akurdi)',
        parts: [
          {
            partName: 'Rear wheel spindle (AI Verified)',
            partNumber: 'SP-001-V',
            material: 'EN8',
            netWeightKg: 0.61,
            scrapPercentage: 5.0,
            annualVolume: 180000,
            setupHours: 2.0,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.createdPartsCount).toBe(1);

    // Verify part exists in DB
    const part = await prisma.part.findFirst({
      where: { partNumber: 'SP-001-V' },
    });
    expect(part).toBeDefined();
    expect(part.partName).toBe('Rear wheel spindle (AI Verified)');
  });
});
