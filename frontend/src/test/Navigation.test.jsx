import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App.jsx';
import * as challengeApi from '../services/challengeApi.js';

vi.mock('../services/challengeApi.js');

describe('Event Dashboard Navigation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');

    challengeApi.fetchEventTimerState.mockResolvedValue({
      status: 'not_started',
      remainingMs: 14400000,
      totalDurationMs: 14400000,
      isCompleted: false,
      isRunning: false
    });

    challengeApi.fetchTeamsList.mockResolvedValue({
      teams: [],
      total: 0,
      page: 1,
      limit: 100
    });
  });

  it('renders Event Dashboard with team name registration card and navigation cards on root path', () => {
    render(<App />);

    expect(screen.getByText(/AI-POWERED BUILD CHALLENGE/i)).toBeInTheDocument();
    expect(screen.getByText(/CHAOS TO/i)).toBeInTheDocument();
    expect(screen.getByText('SOLUTION.')).toBeInTheDocument();

    // Team name input in left area
    expect(screen.getByText(/GET YOUR CHALLENGE/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Binary Beasts/i)).toBeInTheDocument();

    // Action cards
    expect(screen.getByText('Live Event Timer')).toBeInTheDocument();
    expect(screen.getByText('Team Challenges')).toBeInTheDocument();
  });

  it('navigates to Live Event Timer when Live Event Timer action card is clicked', async () => {
    render(<App />);

    const timerCard = screen.getByRole('button', { name: /Navigate to Live Event Timer screen/i });
    fireEvent.click(timerCard);

    await waitFor(() => {
      expect(screen.getByText('04:00:00')).toBeInTheDocument();
      expect(screen.getByText(/CHAOS TO SOLUTION — LIVE EVENT TIMER/i)).toBeInTheDocument();
    });

    expect(window.location.pathname).toBe('/timer');

    // Return back to dashboard
    const backBtn = screen.getByRole('button', { name: /Dashboard/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText(/CHAOS TO/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/');
  });

  it('navigates to Team Challenges table when Team Challenges action card is clicked', async () => {
    render(<App />);

    const teamsCard = screen.getByRole('button', { name: /Navigate to Team Challenges table screen/i });
    fireEvent.click(teamsCard);

    await waitFor(() => {
      expect(screen.getByText(/Team Challenge Table/i)).toBeInTheDocument();
    });

    expect(window.location.pathname).toBe('/teams');

    // Return back to dashboard
    const backBtn = screen.getByRole('button', { name: /Dashboard/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText(/CHAOS TO/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/');
  });
});
