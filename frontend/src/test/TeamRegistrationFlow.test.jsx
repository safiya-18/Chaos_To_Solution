import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App.jsx';
import * as challengeApi from '../services/challengeApi.js';

describe('Team Registration and Persistence Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
  });

  it('keeps Generate button disabled until both team name and theme are provided', () => {
    render(<App />);

    const generateBtn = screen.getByRole('button', { name: /GENERATE MY CHALLENGE/i });
    expect(generateBtn).toBeDisabled();

    // Type team name only
    const teamInput = screen.getByLabelText(/STEP 1: TEAM NAME/i);
    fireEvent.change(teamInput, { target: { value: 'Quantum Coders' } });
    expect(generateBtn).toBeDisabled();

    // Select theme
    const themeCard = screen.getByRole('radio', { name: /FinTech/i });
    fireEvent.click(themeCard);

    // Now both valid -> enabled
    expect(generateBtn).not.toBeDisabled();
    expect(screen.getByText(/Ready to generate for/i)).toBeInTheDocument();
  });

  it('handles 409 TEAM_ALREADY_EXISTS without wiping the selected theme', async () => {
    vi.spyOn(challengeApi, 'registerTeamAndGenerate').mockRejectedValueOnce({
      code: 'TEAM_ALREADY_EXISTS',
      status: 409,
      message: "Team 'Cyber Titans' is already registered for this event."
    });

    render(<App />);

    const teamInput = screen.getByLabelText(/STEP 1: TEAM NAME/i);
    fireEvent.change(teamInput, { target: { value: 'Cyber Titans' } });

    const themeCard = screen.getByRole('radio', { name: /HealthTech/i });
    fireEvent.click(themeCard);

    const generateBtn = screen.getByRole('button', { name: /GENERATE MY CHALLENGE/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Team 'Cyber Titans' is already registered for this event.")
      ).toBeInTheDocument();
    });

    // Theme remains selected
    expect(themeCard).toHaveAttribute('aria-checked', 'true');
  });

  it('handles database failure / 503 error state and renders retry option', async () => {
    vi.spyOn(challengeApi, 'registerTeamAndGenerate').mockRejectedValueOnce({
      code: 'DATABASE_SAVE_FAILED',
      status: 503,
      message: 'Database unavailable. Challenge was generated but could not be saved.'
    });

    render(<App />);

    const teamInput = screen.getByLabelText(/STEP 1: TEAM NAME/i);
    fireEvent.change(teamInput, { target: { value: 'Team Matrix' } });

    const themeCard = screen.getByRole('radio', { name: /EdTech/i });
    fireEvent.click(themeCard);

    const generateBtn = screen.getByRole('button', { name: /GENERATE MY CHALLENGE/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Database unavailable\. Challenge was generated but could not be saved\./i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Generation/i })).toBeInTheDocument();
    });
  });

  it('displays team name badge on Screen 2 upon successful registration', async () => {
    vi.spyOn(challengeApi, 'registerTeamAndGenerate').mockResolvedValueOnce({
      id: 'assignment-123',
      teamName: 'Team Phoenix',
      theme: 'Sustainability',
      challenge: {
        problem: {
          title: 'Smart Solar Grid Micro-Distribution',
          statement: 'Build a decentralized load-balancer for residential solar nodes.'
        },
        restriction: {
          name: 'Low Bandwidth Constraint',
          rule: 'Must operate over 2G or LoRaWAN networks with sub-10kb payloads.'
        },
        resource: {
          name: 'Eclipse Mosquitto MQTT',
          type: 'Message Broker',
          guidance: 'Use lightweight MQTT pub/sub topics.',
          docsUrl: 'https://mosquitto.org/documentation/'
        },
        deliverable: 'A working dashboard receiving real-time solar node telemetry.'
      },
      source: 'ai',
      isPersisted: true,
      createdAt: new Date().toISOString()
    });

    render(<App />);

    const teamInput = screen.getByLabelText(/STEP 1: TEAM NAME/i);
    fireEvent.change(teamInput, { target: { value: 'Team Phoenix' } });

    const themeCard = screen.getByRole('radio', { name: /Sustainability/i });
    fireEvent.click(themeCard);

    const generateBtn = screen.getByRole('button', { name: /GENERATE MY CHALLENGE/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Your Challenge/i })).toBeInTheDocument();
      expect(screen.getByText(/TEAM: Team Phoenix/i)).toBeInTheDocument();
    });
  });
});
