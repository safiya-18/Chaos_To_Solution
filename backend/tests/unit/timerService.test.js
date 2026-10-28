import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimerService } from '../../src/services/timerService.js';
import EventTimer from '../../src/models/EventTimer.js';

describe('TimerService Unit Tests', () => {
  let timerService;
  let mockTimerDoc;
  let mockModel;

  const FOUR_HOURS_MS = 14400000;

  beforeEach(() => {
    mockTimerDoc = new EventTimer({
      eventId: 'test-event',
      durationMs: FOUR_HOURS_MS,
      status: 'not_started',
      remainingMs: FOUR_HOURS_MS
    });

    mockTimerDoc.save = vi.fn().mockResolvedValue(mockTimerDoc);

    mockModel = {
      findOne: vi.fn().mockResolvedValue(mockTimerDoc),
      create: vi.fn().mockResolvedValue(mockTimerDoc)
    };

    timerService = new TimerService({
      model: mockModel,
      eventId: 'test-event',
      durationMs: FOUR_HOURS_MS
    });
  });

  describe('Initial State', () => {
    it('should report not_started with full duration when unstarted', async () => {
      const state = await timerService.getState('test-event');
      expect(state.status).toBe('not_started');
      expect(state.durationMs).toBe(FOUR_HOURS_MS);
      expect(state.remainingMs).toBe(FOUR_HOURS_MS);
      expect(state.startedAt).toBeNull();
      expect(state.endsAt).toBeNull();
    });
  });

  describe('Starting Timer', () => {
    it('should transition from not_started to running and set authoritative timestamps', async () => {
      const startTime = new Date('2026-10-28T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(startTime);

      const state = await timerService.start('test-event');

      expect(state.status).toBe('running');
      expect(state.remainingMs).toBe(FOUR_HOURS_MS);
      expect(new Date(state.startedAt).getTime()).toBe(startTime.getTime());
      expect(new Date(state.endsAt).getTime()).toBe(startTime.getTime() + FOUR_HOURS_MS);

      vi.useRealTimers();
    });

    it('should be idempotent: calling start while running does not restart timer', async () => {
      const startTime = new Date('2026-10-28T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(startTime);

      await timerService.start('test-event');

      // Advance by 30 minutes
      vi.setSystemTime(new Date('2026-10-28T10:30:00Z'));

      const secondStart = await timerService.start('test-event');

      expect(secondStart.status).toBe('running');
      expect(new Date(secondStart.startedAt).getTime()).toBe(startTime.getTime());
      // Remaining should be 3.5 hours, NOT reset to 4 hours
      expect(secondStart.remainingMs).toBe(FOUR_HOURS_MS - 30 * 60 * 1000);

      vi.useRealTimers();
    });

    it('should reject start if timer is already completed', async () => {
      mockTimerDoc.status = 'completed';
      mockTimerDoc.remainingMs = 0;

      await expect(timerService.start('test-event')).rejects.toMatchObject({
        statusCode: 400,
        code: 'TIMER_ALREADY_COMPLETED'
      });
    });
  });

  describe('Pausing and Resuming', () => {
    it('should pause a running timer and freeze remaining time', async () => {
      const startTime = new Date('2026-10-28T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(startTime);

      await timerService.start('test-event');

      // 1 hour passes
      vi.setSystemTime(new Date('2026-10-28T11:00:00Z'));

      const pausedState = await timerService.pause('test-event');
      expect(pausedState.status).toBe('paused');
      expect(pausedState.remainingMs).toBe(3 * 60 * 60 * 1000);

      vi.useRealTimers();
    });

    it('should resume a paused timer continuing from remaining time', async () => {
      const startTime = new Date('2026-10-28T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(startTime);

      await timerService.start('test-event');
      vi.setSystemTime(new Date('2026-10-28T11:00:00Z'));
      await timerService.pause('test-event');

      // Paused for 2 hours (should not reduce remaining time)
      vi.setSystemTime(new Date('2026-10-28T13:00:00Z'));

      const resumedState = await timerService.resume('test-event');
      expect(resumedState.status).toBe('running');
      expect(resumedState.remainingMs).toBe(3 * 60 * 60 * 1000);

      vi.useRealTimers();
    });
  });

  describe('Countdown Expiry & Reset', () => {
    it('should transition to completed and clamp remaining time to 0 when time expires', async () => {
      const startTime = new Date('2026-10-28T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(startTime);

      await timerService.start('test-event');

      // 5 hours pass (past 4 hour end)
      vi.setSystemTime(new Date('2026-10-28T15:00:00Z'));

      const expiredState = await timerService.getState('test-event');
      expect(expiredState.status).toBe('completed');
      expect(expiredState.remainingMs).toBe(0);

      vi.useRealTimers();
    });

    it('should reset timer to not_started upon authorized reset call', async () => {
      mockTimerDoc.status = 'completed';
      mockTimerDoc.remainingMs = 0;

      const resetState = await timerService.reset('test-event');
      expect(resetState.status).toBe('not_started');
      expect(resetState.remainingMs).toBe(FOUR_HOURS_MS);
      expect(resetState.startedAt).toBeNull();
      expect(resetState.endsAt).toBeNull();
    });
  });
});
