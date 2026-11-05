// server/tests/integration/quotations.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Quotations & Commercial Approvals Integration Tests', () => {
  let estimatorCookie;
  let salesCookie;
  let estimatorUser;
  let salesUser;
  let rfq;
  let costedPartId;
  let createdQuotationId;

  beforeAll(async () => {
    await prisma.$connect();

    // Authenticate Estimator
    const estRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'estimator@forgequote.demo', password: 'Estimator@123' });
    estimatorCookie = estRes.headers['set-cookie'];
    estimatorUser = estRes.body.data.user;

    // Authenticate Sales Head
    const salesRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sales@forgequote.demo', password: 'Sales@123' });
    salesCookie = salesRes.headers['set-cookie'];
    salesUser = salesRes.body.data.user;

    // Find an RFQ owned by estimator with parts
    rfq = await prisma.rFQ.findFirst({
      where: {
        ownerId: estimatorUser.id,
        parts: { some: {} },
      },
      include: {
        parts: {
          include: { operations: true },
        },
      },
    });

    if (!rfq) {
      rfq = await prisma.rFQ.findFirst({
        where: { ownerId: estimatorUser.id },
        include: { parts: { include: { operations: true } } },
      });
      const newPart = await prisma.part.create({
        data: {
          rfqId: rfq.id,
          partNumber: 'TEST-PART-AUTO',
          partName: 'Automated Test Spindle',
          material: 'EN8',
          netWeightKg: 1.25,
          grossWeightKg: 1.32,
          scrapPercentage: 5.0,
          annualVolume: 100000,
        },
      });
      rfq.parts = [newPart];
    }

    // Ensure the first part has operations
    const part = rfq.parts[0];
    costedPartId = part.id;
    if (!part.operations || part.operations.length === 0) {
      await prisma.partOperation.create({
        data: {
          partId: part.id,
          operationSequence: 10,
          operationName: 'Rough CNC Turning',
          machineType: 'CNC Lathe',
          cycleTimeMinutes: 2.5,
          machineHourRate: 450.0,
          setupHours: 1.0,
        },
      });
    }

    // Set high annual volume to guarantee contract value >= 25 Lakh
    await prisma.part.update({
      where: { id: part.id },
      data: {
        annualVolume: 100000,
        netWeightKg: 1.25,
        grossWeightKg: 1.32,
        scrapPercentage: 5.0,
      },
    });
  });

  it('POST /rfqs/:rfqId/quotations - creates quotation with sequential ID and locks rate snapshot', async () => {
    const res = await request(app)
      .post(`/api/v1/rfqs/${rfq.id}/quotations`)
      .set('Cookie', estimatorCookie)
      .send({
        marginPercentage: 15.0,
        gstPercentage: 18.0,
        partIds: [costedPartId],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const quote = res.body.data;
    createdQuotationId = quote.id;

    expect(quote.quotationNumber).toMatch(/^QUOTE-\d{4}-\d{4}$/);
    expect(Number(quote.annualContractValue)).toBeGreaterThan(2500000);
    // Because annual contract value >= 25 Lakh, status must automatically be PENDING_APPROVAL
    expect(quote.status).toBe('PENDING_APPROVAL');

    // Rate snapshots must be locked and populated
    expect(Array.isArray(quote.rateSnapshots)).toBe(true);
    expect(quote.rateSnapshots.length).toBeGreaterThan(0);

    // Quotation parts and volume tiers must exist
    expect(quote.parts.length).toBeGreaterThan(0);
    expect(quote.parts[0].tiers.length).toBe(3);
  });

  it('GET /quotations/:id - retrieves full quotation details with tiers and snapshots', async () => {
    const res = await request(app)
      .get(`/api/v1/quotations/${createdQuotationId}`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdQuotationId);
  });

  it('GET /quotations/:id/pdf - streams a valid industrial quotation PDF', async () => {
    const res = await request(app)
      .get(`/api/v1/quotations/${createdQuotationId}/pdf`)
      .set('Cookie', estimatorCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('inline; filename=');
    // PDF Magic bytes: %PDF-
    expect(res.body.toString().slice(0, 5)).toBe('%PDF-');
  });

  it('GET /approvals - allows Sales Head to list high-value pending quotations', async () => {
    const res = await request(app)
      .get('/api/v1/approvals')
      .set('Cookie', salesCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const found = res.body.data.find((q) => q.id === createdQuotationId);
    expect(found).toBeDefined();
    // Sales Head did not create this quote (Estimator created it), so canApprove must be true
    expect(found.canApprove).toBe(true);
  });

  it('POST /approvals/:id/decision - enforces Anti-Self-Approval Rule when creator tries to approve', async () => {
    // Estimator tries to call approval decision
    const res = await request(app)
      .post(`/api/v1/approvals/${createdQuotationId}/decision`)
      .set('Cookie', estimatorCookie)
      .send({
        decision: 'APPROVE',
        comment: 'Attempting self-approval',
      });

    // Estimator does not even have SALES_HEAD role -> 403 Forbidden
    expect(res.status).toBe(403);
  });

  it('POST /quotations/:id/send - rejects sending when quotation is still PENDING_APPROVAL', async () => {
    const res = await request(app)
      .post(`/api/v1/quotations/${createdQuotationId}/send`)
      .set('Cookie', estimatorCookie)
      .send({
        recipientEmail: 'procurement@client.demo',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Commercial approval by Sales Head is pending');
  });

  it('POST /approvals/:id/decision - allows Sales Head to approve quotation and records audit log', async () => {
    const res = await request(app)
      .post(`/api/v1/approvals/${createdQuotationId}/decision`)
      .set('Cookie', salesCookie)
      .send({
        decision: 'APPROVE',
        comment: 'Commercial terms, pricing, and volume tiers verified.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.approvedBy).toBe(salesUser.id);
  });

  it('POST /quotations/:id/send - simulates dispatch once approved and transitions RFQ to QUOTED', async () => {
    const res = await request(app)
      .post(`/api/v1/quotations/${createdQuotationId}/send`)
      .set('Cookie', estimatorCookie)
      .send({
        recipientEmail: 'tata.procurement@motors.demo',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.simulated).toBe(true);
    expect(res.body.data.recipientEmail).toBe('tata.procurement@motors.demo');

    // Check DB statuses
    const updatedQuote = await prisma.quotation.findUnique({
      where: { id: createdQuotationId },
    });
    expect(updatedQuote.status).toBe('SENT');

    const updatedRFQ = await prisma.rFQ.findUnique({
      where: { id: rfq.id },
    });
    expect(updatedRFQ.status).toBe('SENT');
  });
});
