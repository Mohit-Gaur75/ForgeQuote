import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('RFQ API Integration Tests (/api/v1/rfqs)', () => {
  let estimatorCookie;
  let salesCookie;
  let seededRfqId;

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

    // Fetch an RFQ to reference
    const rfq = await prisma.rFQ.findFirst({ where: { rfqNumber: 'RFQ-2026-0001' } });
    seededRfqId = rfq.id;
  });

  it('GET /rfqs - returns list of RFQs with pagination metadata', async () => {
    const res = await request(app)
      .get('/api/v1/rfqs')
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  it('GET /rfqs - identifies overdue RFQs correctly', async () => {
    // Ensure RFQ-2026-0004 is in ESTIMATING status with past due date for idempotent test runs
    await prisma.rFQ.updateMany({
      where: { rfqNumber: 'RFQ-2026-0004' },
      data: {
        status: 'ESTIMATING',
        dueDate: new Date(Date.now() - 3 * 86400000),
      },
    });

    const res = await request(app)
      .get('/api/v1/rfqs?isOverdue=true')
      .set('Cookie', salesCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const overdueRfqs = res.body.data;
    expect(overdueRfqs.length).toBeGreaterThanOrEqual(1);
    expect(overdueRfqs.some((r) => r.rfqNumber === 'RFQ-2026-0004')).toBe(true);
    expect(overdueRfqs[0].isOverdue).toBe(true);
  });

  it('GET /rfqs - filters by customer search string', async () => {
    const res = await request(app)
      .get('/api/v1/rfqs?search=Bajaj')
      .set('Cookie', salesCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.every((r) => r.customerName.toLowerCase().includes('bajaj'))).toBe(true);
  });

  it('POST /rfqs - allows Estimator to create a new RFQ with auto-assigned number', async () => {
    const res = await request(app)
      .post('/api/v1/rfqs')
      .set('Cookie', estimatorCookie)
      .send({
        customerName: 'Kirloskar Oil Engines',
        customerType: 'Engine OEM',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rfqNumber).toMatch(/^RFQ-\d{4}-\d{4}$/);
    expect(res.body.data.customerName).toBe('Kirloskar Oil Engines');
    expect(res.body.data.status).toBe('ESTIMATING');
  });

  it('POST /rfqs - forbids Sales Head from creating RFQs (Estimator only)', async () => {
    const res = await request(app)
      .post('/api/v1/rfqs')
      .set('Cookie', salesCookie)
      .send({
        customerName: 'Unauthorized RFQ Creation',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /rfqs/:id - retrieves RFQ details with parts array', async () => {
    const res = await request(app)
      .get(`/api/v1/rfqs/${seededRfqId}`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(seededRfqId);
    expect(Array.isArray(res.body.data.parts)).toBe(true);
  });

  it('PATCH /rfqs/:id/status - allows Sales Head to update status', async () => {
    const res = await request(app)
      .patch(`/api/v1/rfqs/${seededRfqId}/status`)
      .set('Cookie', salesCookie)
      .send({
        status: 'WON',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('WON');
  });

  it('PATCH /rfqs/:id/status - forbids Estimator from marking RFQ status', async () => {
    const res = await request(app)
      .patch(`/api/v1/rfqs/${seededRfqId}/status`)
      .set('Cookie', estimatorCookie)
      .send({
        status: 'WON',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
