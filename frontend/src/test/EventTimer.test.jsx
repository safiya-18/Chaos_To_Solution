import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventTimer, formatMilliseconds } from '../components/EventTimer.jsx';
import * as challengeApi from '../services/challengeApi.js';

describe('EventTimer Component & Formatter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('formatMilliseconds utility', () => {
    it('formats exact 4 hours as 04:00:00', () => {
      expect(formatMilliseconds(4 * 60 * 60 * 1000)).toBe('04:00:00');
    });

    it('formats partial durations accurately', () => {
      // 1 hour, 23 minutes, 45 seconds = (1*3600 + 23*60 + 45) * 1000 = 5025000 ms
      expect(formatMilliseconds(5025000)).toBe('01:23:45');
    });

    it('formats single-digit components with leading zeros', () => {
      // 5 minutes, 8 seconds = (5*60 + 8) * 1000 = 308000 ms
      expect(formatMilliseconds(308000)).toBe('00:05:08');
    });

    it('clamps negative or zero durations to 00:00:00', () => {
      expect(formatMilliseconds(0)).toBe('00:00:00');
      expect(formatMilliseconds(-5000)).toBe('00:00:00');
    });
  });

  describe('EventTimer lifecycle rendering', () => {
    it('renders not_started state correctly', async () => {
      vi.spyOn(challengeApi, 'fetchEventTimerState').mockResolvedValueOnce({
        status: 'not_started',
        durationMs: 14400000,
        remainingMs: 14400000,
        formattedRemaining: '04:00:00',
        endsAt: null
      });

      render(<EventTimer />);

      await waitFor(() => {
        expect(screen.getByText('04:00:00')).toBeInTheDocument();
        expect(screen.getByText('EVENT TIME (4H)')).toBeInTheDocument();
      });
    });

    it('renders running state with warning class when under 60 minutes', async () => {
      // 45 minutes remaining = 45 * 60 * 1000 = 2700000 ms
      const endsAt = new Date(Date.now() + 2700000).toISOString();
      vi.spyOn(challengeApi, 'fetchEventTimerState').mockResolvedValueOnce({
        status: 'running',
        durationMs: 14400000,
        remainingMs: 2700000,
        formattedRemaining: '00:45:00',
        endsAt
      });

      render(<EventTimer />);

      await waitFor(() => {
        expect(screen.getByText('FINAL HOUR')).toBeInTheDocument();
        const display = screen.getByRole('timer');
        expect(display.className).toContain('text-amber-800');
      });
    });

    it('renders critical class when under 10 minutes', async () => {
      // 8 minutes remaining = 8 * 60 * 1000 = 480000 ms
      const endsAt = new Date(Date.now() + 480000).toISOString();
      vi.spyOn(challengeApi, 'fetchEventTimerState').mockResolvedValueOnce({
        status: 'running',
        durationMs: 14400000,
        remainingMs: 480000,
        formattedRemaining: '00:08:00',
        endsAt
      });

      render(<EventTimer />);

      await waitFor(() => {
        expect(screen.getByText('FINAL SPRINT')).toBeInTheDocument();
        const display = screen.getByRole('timer');
        expect(display.className).toContain('text-red-700');
      });
    });

    it('renders paused state correctly', async () => {
      vi.spyOn(challengeApi, 'fetchEventTimerState').mockResolvedValueOnce({
        status: 'paused',
        durationMs: 14400000,
        remainingMs: 7200000, // 2 hours
        formattedRemaining: '02:00:00',
        endsAt: null
      });

      render(<EventTimer />);

      await waitFor(() => {
        expect(screen.getByText('COUNTDOWN PAUSED')).toBeInTheDocument();
        expect(screen.getByText('02:00:00')).toBeInTheDocument();
      });
    });

    it('renders completed state when event has finished', async () => {
      vi.spyOn(challengeApi, 'fetchEventTimerState').mockResolvedValueOnce({
        status: 'completed',
        durationMs: 14400000,
        remainingMs: 0,
        formattedRemaining: '00:00:00',
        endsAt: new Date(Date.now() - 1000).toISOString()
      });

      render(<EventTimer />);

      await waitFor(() => {
        expect(screen.getByText('HACKATHON ENDED')).toBeInTheDocument();
        expect(screen.getByText('00:00:00')).toBeInTheDocument();
      });
    });

    it('handles timer fetch error gracefully and shows syncing status without fabricating countdown', async () => {
      vi.spyOn(challengeApi, 'fetchEventTimerState').mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<EventTimer />);

      await waitFor(() => {
        expect(screen.getByText('TIMER CONNECTING')).toBeInTheDocument();
        expect(screen.getByText('--:--:--')).toBeInTheDocument();
      });
    });
  });
});
