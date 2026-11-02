import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Rate Master API Integration Tests (/api/v1/rates)', () => {
  let estimatorCookie;
  let salesCookie;
  let en8RateId;

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

    const en8 = await prisma.rateMaster.findFirst({
      where: { rateName: 'EN8 Bright Bar' },
    });
    en8RateId = en8.id;
  });

  it('GET /rates - retrieves list of rates with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/rates')
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /rates/effective - returns rates effective at specified date', async () => {
    const res = await request(app)
      .get('/api/v1/rates/effective?at=2026-08-01T00:00:00.000Z')
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const rates = res.body.data;
    expect(rates.length).toBeGreaterThan(0);

    // Verify EN8 active in August 2026 is version 2
    const en8 = rates.find((r) => r.rateName === 'EN8 Bright Bar');
    expect(en8).toBeDefined();
    expect(en8.versionNumber).toBe(2);
  });

  it('GET /rates/:id/history - returns all versions of a rate item', async () => {
    const res = await request(app)
      .get(`/api/v1/rates/${en8RateId}/history`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    // Descending version order
    expect(res.body.data[0].versionNumber).toBeGreaterThan(res.body.data[1].versionNumber);
  });

  it('POST /rates - allows Sales Head to create a new version of a rate', async () => {
    const res = await request(app)
      .post('/api/v1/rates')
      .set('Cookie', salesCookie)
      .send({
        rateType: 'MATERIAL',
        rateName: 'EN8 Bright Bar',
        materialGrade: 'EN8',
        rateValue: 92.50,
        unit: 'INR/kg',
        currency: 'INR',
        effectiveFrom: '2026-12-01T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.versionNumber).toBeGreaterThanOrEqual(3);
    expect(Number(res.body.data.rateValue)).toBe(92.50);
  });

  it('POST /rates - forbids Estimators from creating master rates (Sales Head only)', async () => {
    const res = await request(app)
      .post('/api/v1/rates')
      .set('Cookie', estimatorCookie)
      .send({
        rateType: 'MATERIAL',
        rateName: 'Unauthorized Rate',
        rateValue: 100,
        unit: 'INR/kg',
        effectiveFrom: '2026-12-01T00:00:00.000Z',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /rates - detects and blocks overlapping effective periods', async () => {
    // Attempting to create an overlapping version in the past window (e.g. March 2026 where v1 was 2026-01-01 to 2026-06-30)
    const res = await request(app)
      .post('/api/v1/rates')
      .set('Cookie', salesCookie)
      .send({
        rateType: 'MATERIAL',
        rateName: 'EN8 Bright Bar',
        materialGrade: 'EN8',
        rateValue: 99.00,
        unit: 'INR/kg',
        effectiveFrom: '2026-03-01T00:00:00.000Z',
        effectiveTo: '2026-05-01T00:00:00.000Z',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});
