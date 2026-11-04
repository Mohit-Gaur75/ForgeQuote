// server/tests/integration/history.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Historical Parts & Deterministic Routing API Tests', () => {
  let estimatorCookie;
  let targetPart;
  let sourcePart;

  beforeAll(async () => {
    await prisma.$connect();

    const estRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'estimator@forgequote.demo', password: 'Estimator@123' });
    estimatorCookie = estRes.headers['set-cookie'];

    // Find source part with operations (e.g. SP-001)
    sourcePart = await prisma.part.findFirst({
      where: {
        partNumber: 'SP-001',
        operations: { some: {} },
      },
      include: { operations: true },
    });

    // Find or create target part that needs routing (e.g. SP-002)
    targetPart = await prisma.part.findFirst({
      where: {
        partNumber: 'SP-002',
      },
    });
  });

  it('GET /api/v1/history/search - returns paginated historical components and quotations', async () => {
    const res = await request(app)
      .get('/api/v1/history/search?page=1&limit=10')
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('GET /api/v1/history/search - filters by material grade and search keyword', async () => {
    const res = await request(app)
      .get('/api/v1/history/search?q=spindle&material=EN8')
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].material).toBe('EN8');
  });

  it('GET /api/v1/parts/:id/routing-suggestions - returns deterministic similarity scores and breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/parts/${targetPart.id}/routing-suggestions`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      const topMatch = res.body.data[0];
      expect(topMatch.similarityScore).toBeGreaterThanOrEqual(0.5);
      expect(topMatch.breakdown).toBeDefined();
      expect(topMatch.breakdown.name).toBeDefined();
      expect(topMatch.breakdown.material).toBeDefined();
      expect(topMatch.breakdown.weight).toBeDefined();
      expect(Array.isArray(topMatch.operations)).toBe(true);
    }
  });

  it('POST /api/v1/parts/:id/apply-routing - copies operations from source historical part', async () => {
    const res = await request(app)
      .post(`/api/v1/parts/${targetPart.id}/apply-routing`)
      .set('Cookie', estimatorCookie)
      .send({
        sourcePartId: sourcePart.id,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.operations.length).toBe(sourcePart.operations.length);

    // Verify in database
    const updatedTarget = await prisma.part.findUnique({
      where: { id: targetPart.id },
      include: { operations: true },
    });
    expect(updatedTarget.operations.length).toBe(sourcePart.operations.length);
  });
});
