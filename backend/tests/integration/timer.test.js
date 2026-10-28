import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import timerService from '../../src/services/timerService.js';
import config from '../../src/config/env.js';

describe('Event Timer Endpoints (/api/event-timer)', () => {
  const TEST_ADMIN_TOKEN = 'test-secret-operator-token-xyz';

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('EVENT_ADMIN_TOKEN', TEST_ADMIN_TOKEN);
  });

  describe('GET /api/event-timer (Public)', () => {
    it('should return HTTP 200 with authoritative timer state to any participant', async () => {
      const mockState = {
        eventId: 'cts-2026',
        status: 'not_started',
        durationMs: 14400000,
        startedAt: null,
        endsAt: null,
        pausedAt: null,
        remainingMs: 14400000,
        serverTime: new Date().toISOString()
      };

      vi.spyOn(timerService, 'getState').mockResolvedValue(mockState);

      const res = await request(app).get('/api/event-timer');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('not_started');
      expect(res.body.data.remainingMs).toBe(14400000);
      // Ensure admin token is NEVER returned
      expect(JSON.stringify(res.body)).not.toContain(TEST_ADMIN_TOKEN);
    });
  });

  describe('Operator Authorization Guard', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const res = await request(app).post('/api/event-timer/start');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return HTTP 401 when Authorization header is not Bearer token', async () => {
      const res = await request(app)
        .post('/api/event-timer/start')
        .set('Authorization', 'Basic 123456');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_AUTH_FORMAT');
    });

    it('should return HTTP 403 when Bearer token is invalid', async () => {
      const res = await request(app)
        .post('/api/event-timer/start')
        .set('Authorization', 'Bearer wrong-operator-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Protected Operator Operations with Valid Token', () => {
    it('POST /api/event-timer/start starts the timer with valid token', async () => {
      const mockRunningState = {
        eventId: 'cts-2026',
        status: 'running',
        durationMs: 14400000,
        startedAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 14400000).toISOString(),
        pausedAt: null,
        remainingMs: 14400000,
        serverTime: new Date().toISOString()
      };

      vi.spyOn(timerService, 'start').mockResolvedValue(mockRunningState);

      const res = await request(app)
        .post('/api/event-timer/start')
        .set('Authorization', `Bearer ${TEST_ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('running');
    });

    it('POST /api/event-timer/pause pauses the timer with valid token', async () => {
      const mockPausedState = {
        eventId: 'cts-2026',
        status: 'paused',
        durationMs: 14400000,
        startedAt: new Date().toISOString(),
        endsAt: null,
        pausedAt: new Date().toISOString(),
        remainingMs: 10000000,
        serverTime: new Date().toISOString()
      };

      vi.spyOn(timerService, 'pause').mockResolvedValue(mockPausedState);

      const res = await request(app)
        .post('/api/event-timer/pause')
        .set('Authorization', `Bearer ${TEST_ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('paused');
    });

    it('POST /api/event-timer/resume resumes the timer with valid token', async () => {
      const mockResumedState = {
        eventId: 'cts-2026',
        status: 'running',
        durationMs: 14400000,
        startedAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 10000000).toISOString(),
        pausedAt: null,
        remainingMs: 10000000,
        serverTime: new Date().toISOString()
      };

      vi.spyOn(timerService, 'resume').mockResolvedValue(mockResumedState);

      const res = await request(app)
        .post('/api/event-timer/resume')
        .set('Authorization', `Bearer ${TEST_ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('running');
    });

    it('POST /api/event-timer/reset resets the timer with valid token', async () => {
      const mockResetState = {
        eventId: 'cts-2026',
        status: 'not_started',
        durationMs: 14400000,
        startedAt: null,
        endsAt: null,
        pausedAt: null,
        remainingMs: 14400000,
        serverTime: new Date().toISOString()
      };

      vi.spyOn(timerService, 'reset').mockResolvedValue(mockResetState);

      const res = await request(app)
        .post('/api/event-timer/reset')
        .set('Authorization', `Bearer ${TEST_ADMIN_TOKEN}`)
        .send({ durationMs: 14400000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('not_started');
    });
  });
});
