// server/tests/integration/audit.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Audit Log API Integration Tests (/api/v1/audit)', () => {
  let estimatorCookie;
  let sampleRfqId;

  beforeAll(async () => {
    await prisma.$connect();

    // Login as Estimator
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'estimator@forgequote.demo', password: 'Estimator@123' });

    estimatorCookie = loginRes.headers['set-cookie'];

    // Find any existing RFQ to query
    const rfq = await prisma.rFQ.findFirst();
    sampleRfqId = rfq?.id;
  });

  it('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get(`/api/v1/audit/RFQ/${sampleRfqId}`);
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/audit/:entityType/:entityId - returns audit logs array with user details', async () => {
    const res = await request(app)
      .get(`/api/v1/audit/RFQ/${sampleRfqId}`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      const log = res.body.data[0];
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('entityType', 'RFQ');
      expect(log).toHaveProperty('entityId', sampleRfqId);
      expect(log).toHaveProperty('user');
      expect(log.user).toHaveProperty('name');
    }
  });

  it('GET /api/v1/audit?entityType=RFQ - supports query parameters', async () => {
    const res = await request(app)
      .get('/api/v1/audit?entityType=RFQ')
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
