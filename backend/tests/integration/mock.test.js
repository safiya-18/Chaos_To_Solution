import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/mock/:dataset', () => {
  const publicApiMocks = ['weather', 'products', 'countries', 'books', 'quotes'];

  publicApiMocks.forEach((mockName) => {
    it(`should serve HTTP 200 with valid mock JSON for /api/mock/${mockName}`, async () => {
      const res = await request(app).get(`/api/mock/${mockName}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).not.toBeNull();
    });
  });

  it('should return HTTP 404 with MOCK_NOT_FOUND error for unknown mock dataset', async () => {
    const res = await request(app).get('/api/mock/unknown-dataset');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'MOCK_NOT_FOUND'
      }
    });
  });
});
