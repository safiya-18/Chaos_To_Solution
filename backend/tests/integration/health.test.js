import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/health', () => {
  it('should return HTTP 200 with status ok and valid health payload', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toMatchObject({
      status: 'ok',
      version: '1.0.0'
    });
    expect(typeof res.body.data.uptime).toBe('number');
    expect(new Date(res.body.data.timestamp).toISOString()).toBe(res.body.data.timestamp);
  });

  it('should include Helmet security headers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('should support CORS origin headers for allowed frontend origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('should allow production Vercel origins and block unauthorized origins', async () => {
    const allowedRes = await request(app)
      .get('/api/health')
      .set('Origin', 'https://ctschallenge.vercel.app');
    expect(allowedRes.headers['access-control-allow-origin']).toBe('https://ctschallenge.vercel.app');

    const blockedRes = await request(app)
      .get('/api/health')
      .set('Origin', 'https://unauthorized-domain.com');
    expect(blockedRes.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('404 Route Handling', () => {
  it('should return HTTP 404 with standardized error JSON envelope for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Cannot GET /api/unknown-endpoint'
      }
    });
  });
});
