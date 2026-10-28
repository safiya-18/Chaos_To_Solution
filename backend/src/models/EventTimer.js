import mongoose from 'mongoose';
import config from '../config/env.js';

const EventTimerSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: () => config.eventId
    },
    durationMs: {
      type: Number,
      required: true,
      default: () => config.eventTimerDurationMs // 14,400,000 ms (4 hours)
    },
    status: {
      type: String,
      required: true,
      enum: ['not_started', 'running', 'paused', 'completed'],
      default: 'not_started'
    },
    startedAt: {
      type: Date,
      default: null
    },
    endsAt: {
      type: Date,
      default: null
    },
    pausedAt: {
      type: Date,
      default: null
    },
    remainingMs: {
      type: Number,
      default: () => config.eventTimerDurationMs
    }
  },
  {
    timestamps: true
  }
);

/**
 * Calculates authoritative remaining time in milliseconds given current timestamp.
 */
EventTimerSchema.methods.calculateCurrentState = function (now = new Date()) {
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (this.status === 'not_started') {
    return {
      status: 'not_started',
      remainingMs: this.durationMs,
      startedAt: null,
      endsAt: null,
      pausedAt: null
    };
  }

  if (this.status === 'paused') {
    return {
      status: 'paused',
      remainingMs: Math.max(0, this.remainingMs),
      startedAt: this.startedAt,
      endsAt: this.endsAt,
      pausedAt: this.pausedAt
    };
  }

  if (this.status === 'completed') {
    return {
      status: 'completed',
      remainingMs: 0,
      startedAt: this.startedAt,
      endsAt: this.endsAt,
      pausedAt: null
    };
  }

  // running
  const endTime = this.endsAt ? new Date(this.endsAt).getTime() : 0;
  const remaining = Math.max(0, endTime - currentTime);

  if (remaining === 0) {
    this.status = 'completed';
    this.remainingMs = 0;
    return {
      status: 'completed',
      remainingMs: 0,
      startedAt: this.startedAt,
      endsAt: this.endsAt,
      pausedAt: null
    };
  }

  return {
    status: 'running',
    remainingMs: remaining,
    startedAt: this.startedAt,
    endsAt: this.endsAt,
    pausedAt: null
  };
};

export const EventTimer = mongoose.model('EventTimer', EventTimerSchema);
export default EventTimer;
