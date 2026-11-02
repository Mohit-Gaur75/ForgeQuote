import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Auth API Integration Tests (/api/v1/auth)', () => {
  beforeAll(async () => {
    // Ensure DB connection is active
    await prisma.$connect();
  });

  it('POST /auth/login - succeeds with valid estimator credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'estimator@forgequote.demo',
        password: 'Estimator@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('estimator@forgequote.demo');
    expect(res.body.data.user.role).toBe('ESTIMATOR');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('forgequote_session=');
  });

  it('POST /auth/login - succeeds with valid sales head credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'sales@forgequote.demo',
        password: 'Sales@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('sales@forgequote.demo');
    expect(res.body.data.user.role).toBe('SALES_HEAD');
  });

  it('POST /auth/login - fails with incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'estimator@forgequote.demo',
        password: 'WrongPassword@999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('POST /auth/login - fails with non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@company.com',
        password: 'SomePassword@123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /auth/me - returns user profile with valid session cookie', async () => {
    // First login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'estimator@forgequote.demo',
        password: 'Estimator@123',
      });

    const cookie = loginRes.headers['set-cookie'];

    // Call /me with cookie
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('estimator@forgequote.demo');
    expect(meRes.body.data.user.role).toBe('ESTIMATOR');
  });

  it('GET /auth/me - rejects request without session cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('POST /auth/logout - clears session cookie and revokes session', async () => {
    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'estimator@forgequote.demo',
        password: 'Estimator@123',
      });

    const cookie = loginRes.headers['set-cookie'];

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Call /me again with old cookie
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(401);
  });
});
