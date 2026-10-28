import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimerScreen } from '../components/TimerScreen.jsx';
import { RouterProvider } from '../router/Router.jsx';
import * as challengeApi from '../services/challengeApi.js';

vi.mock('../services/challengeApi.js');

describe('TimerScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.history.pushState({}, '', '/timer');

    challengeApi.fetchEventTimerState.mockResolvedValue({
      status: 'not_started',
      remainingMs: 14400000,
      totalDurationMs: 14400000,
      isCompleted: false,
      isRunning: false
    });
  });

  it('renders initial 4-hour countdown digits and NOT STARTED status', async () => {
    render(
      <RouterProvider>
        <TimerScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('04:00:00')).toBeInTheDocument();
    });

    expect(screen.getByText(/NOT STARTED/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  it('prompts for operator authorization token when an action is clicked without token', async () => {
    render(
      <RouterProvider>
        <TimerScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('04:00:00')).toBeInTheDocument();
    });

    const startBtn = screen.getByRole('button', { name: /Start Event/i });
    fireEvent.click(startBtn);

    expect(screen.getByText(/Event Operator Token/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter EVENT_ADMIN_TOKEN/i)).toBeInTheDocument();
  });

  it('successfully executes operator action and never exposes token in sessionStorage', async () => {
    challengeApi.startEventTimer.mockResolvedValue({
      status: 'running',
      remainingMs: 14400000,
      totalDurationMs: 14400000,
      isCompleted: false,
      isRunning: true
    });

    render(
      <RouterProvider>
        <TimerScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('04:00:00')).toBeInTheDocument();
    });

    // Click start to open modal
    fireEvent.click(screen.getByRole('button', { name: /Start Event/i }));

    const tokenInput = screen.getByPlaceholderText(/Enter EVENT_ADMIN_TOKEN/i);
    fireEvent.change(tokenInput, { target: { value: 'secret-token-123' } });

    const confirmBtn = screen.getByRole('button', { name: /Save & Authorize/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(challengeApi.startEventTimer).toHaveBeenCalledWith('secret-token-123');
    });

    // Security Verification: Token must NOT be stored in browser storage
    expect(sessionStorage.getItem('cts_operator_token')).toBeNull();
  });

  it('displays error message when operator token is invalid (401)', async () => {
    challengeApi.startEventTimer.mockRejectedValue({
      status: 401,
      message: 'Unauthorized: Invalid operator token'
    });

    render(
      <RouterProvider>
        <TimerScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('04:00:00')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Event/i }));

    const tokenInput = screen.getByPlaceholderText(/Enter EVENT_ADMIN_TOKEN/i);
    fireEvent.change(tokenInput, { target: { value: 'wrong-token' } });

    const confirmBtn = screen.getByRole('button', { name: /Save & Authorize/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid operator token|Unauthorized/i)).toBeInTheDocument();
    });
  });

  it('navigates back when Dashboard button is clicked', async () => {
    render(
      <RouterProvider>
        <TimerScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('04:00:00')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Dashboard/i });
    fireEvent.click(backBtn);

    expect(window.location.pathname).toBe('/');
  });
});
