import EventTimer from '../models/EventTimer.js';
import config from '../config/env.js';

export class TimerService {
  constructor({ model = EventTimer, eventId = config.eventId, durationMs = config.eventTimerDurationMs } = {}) {
    this.model = model;
    this.eventId = eventId;
    this.durationMs = durationMs;
  }

  /**
   * Idempotently finds or creates the event timer document.
   */
  async getOrCreateTimer(eventId = this.eventId) {
    let timer = await this.model.findOne({ eventId });
    if (!timer) {
      try {
        timer = await this.model.create({
          eventId,
          durationMs: this.durationMs,
          status: 'not_started',
          remainingMs: this.durationMs
        });
      } catch (err) {
        // Handle race condition if two requests create simultaneously
        if (err.code === 11000) {
          timer = await this.model.findOne({ eventId });
        } else {
          throw err;
        }
      }
    }
    return timer;
  }

  /**
   * Returns authoritative timer state with current remaining time calculated from server clock.
   */
  async getState(eventId = this.eventId) {
    const timer = await this.getOrCreateTimer(eventId);
    const now = new Date();
    const calculated = timer.calculateCurrentState(now);

    // If calculation concluded the timer transitioned to completed, persist state
    if (calculated.status === 'completed' && timer.status === 'running') {
      timer.status = 'completed';
      timer.remainingMs = 0;
      await timer.save();
    }

    return {
      eventId: timer.eventId,
      status: calculated.status,
      durationMs: timer.durationMs,
      startedAt: calculated.startedAt,
      endsAt: calculated.endsAt,
      pausedAt: calculated.pausedAt,
      remainingMs: calculated.remainingMs,
      serverTime: now.toISOString()
    };
  }

  /**
   * Starts the countdown timer.
   * Idempotent: Does not restart an already running timer.
   */
  async start(eventId = this.eventId) {
    const timer = await this.getOrCreateTimer(eventId);
    const now = new Date();
    const currentState = timer.calculateCurrentState(now);

    if (currentState.status === 'completed' || timer.status === 'completed') {
      if (timer.status !== 'completed') {
        timer.status = 'completed';
        timer.remainingMs = 0;
        await timer.save();
      }
      const err = new Error('Timer has already completed. Reset is required before starting again.');
      err.statusCode = 400;
      err.code = 'TIMER_ALREADY_COMPLETED';
      throw err;
    }

    if (currentState.status === 'running') {
      return this.getState(eventId);
    }

    if (timer.status === 'paused') {
      // Resume from paused remaining duration
      const remaining = Math.max(0, timer.remainingMs);
      timer.status = 'running';
      timer.pausedAt = null;
      timer.endsAt = new Date(now.getTime() + remaining);
      await timer.save();
      return this.getState(eventId);
    }

    // Fresh start from not_started
    timer.status = 'running';
    timer.startedAt = now;
    timer.endsAt = new Date(now.getTime() + timer.durationMs);
    timer.pausedAt = null;
    timer.remainingMs = timer.durationMs;
    await timer.save();

    return this.getState(eventId);
  }

  /**
   * Pauses an actively running timer.
   */
  async pause(eventId = this.eventId) {
    const timer = await this.getOrCreateTimer(eventId);
    const now = new Date();
    const state = timer.calculateCurrentState(now);

    if (state.status !== 'running') {
      const err = new Error(`Cannot pause timer in '${state.status}' state.`);
      err.statusCode = 400;
      err.code = 'INVALID_TIMER_STATE';
      throw err;
    }

    timer.status = 'paused';
    timer.pausedAt = now;
    timer.remainingMs = state.remainingMs;
    await timer.save();

    return this.getState(eventId);
  }

  /**
   * Resumes a paused timer.
   */
  async resume(eventId = this.eventId) {
    const timer = await this.getOrCreateTimer(eventId);
    const now = new Date();

    if (timer.status !== 'paused') {
      const err = new Error(`Cannot resume timer in '${timer.status}' state.`);
      err.statusCode = 400;
      err.code = 'INVALID_TIMER_STATE';
      throw err;
    }

    const remaining = Math.max(0, timer.remainingMs);
    timer.status = 'running';
    timer.pausedAt = null;
    timer.endsAt = new Date(now.getTime() + remaining);
    await timer.save();

    return this.getState(eventId);
  }

  /**
   * Resets the event timer (authorized operator action).
   */
  async reset(eventId = this.eventId, customDurationMs = null) {
    const timer = await this.getOrCreateTimer(eventId);
    const duration = customDurationMs && customDurationMs > 0 ? customDurationMs : this.durationMs;

    timer.status = 'not_started';
    timer.durationMs = duration;
    timer.startedAt = null;
    timer.endsAt = null;
    timer.pausedAt = null;
    timer.remainingMs = duration;
    await timer.save();

    return this.getState(eventId);
  }
}

export const timerService = new TimerService();
export default timerService;
