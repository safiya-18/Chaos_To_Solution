import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamsScreen } from '../components/TeamsScreen.jsx';
import { RouterProvider } from '../router/Router.jsx';
import * as challengeApi from '../services/challengeApi.js';

vi.mock('../services/challengeApi.js');

const MOCK_TEAMS_RESPONSE = {
  teams: [
    {
      id: 'team-1',
      teamName: 'Binary Beasts',
      normalizedTeamName: 'binary beasts',
      theme: 'EdTech',
      challenge: {
        problem: {
          title: 'STEM Learning Dropouts',
          statement: 'High student dropouts in rural STEM learning.'
        },
        restriction: {
          name: 'Zero Internet',
          rule: 'Must run entirely offline without internet.'
        },
        resource: {
          name: 'SQLite Local',
          type: 'Database',
          guidance: 'SQLite and local browser caching.',
          docsUrl: 'https://sqlite.org'
        },
        deliverable: 'A working offline browser quiz engine.'
      },
      source: 'ai',
      createdAt: '2026-10-28T12:00:00.000Z'
    },
    {
      id: 'team-2',
      teamName: 'Cyber Phoenix',
      normalizedTeamName: 'cyber phoenix',
      theme: 'FinTech',
      challenge: {
        problem: {
          title: 'Micro-loan Fraud',
          statement: 'Micro-loans fraud in rural cooperatives.'
        },
        restriction: {
          name: 'No Biometrics',
          rule: 'Zero biometric data storage.'
        },
        resource: {
          name: 'ZKP Hash',
          type: 'Cryptography',
          guidance: 'Zero-knowledge proof hash checks.'
        },
        deliverable: 'A verifiable transaction auditor.'
      },
      source: 'fallback',
      createdAt: '2026-10-28T12:10:00.000Z'
    }
  ],
  total: 2,
  page: 1,
  limit: 100
};

describe('TeamsScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/teams');
    challengeApi.fetchTeamsList.mockResolvedValue(MOCK_TEAMS_RESPONSE);
  });

  it('renders teams table with rows and headers', async () => {
    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
      expect(screen.getByText('Cyber Phoenix')).toBeInTheDocument();
    });

    expect(screen.getByText('High student dropouts in rural STEM learning.')).toBeInTheDocument();
    expect(screen.getByText('Micro-loans fraud in rural cooperatives.')).toBeInTheDocument();
    expect(screen.getByText(/2 Teams/i)).toBeInTheDocument();
  });

  it('filters teams by search input', async () => {
    challengeApi.fetchTeamsList.mockImplementation(async ({ search }) => {
      if (search && search.toLowerCase().includes('cyber')) {
        return {
          teams: [MOCK_TEAMS_RESPONSE.teams[1]],
          total: 1,
          page: 1,
          limit: 100
        };
      }
      return MOCK_TEAMS_RESPONSE;
    });

    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search team name or challenge topic/i);
    fireEvent.change(searchInput, { target: { value: 'Cyber' } });

    await waitFor(() => {
      expect(challengeApi.fetchTeamsList).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Cyber' })
      );
    });
  });

  it('opens detail modal when View Challenge button is clicked', async () => {
    challengeApi.fetchTeamsList.mockResolvedValue(MOCK_TEAMS_RESPONSE);

    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    const missionButtons = screen.getAllByRole('button', { name: /View Mission/i });
    expect(missionButtons.length).toBeGreaterThan(0);
    fireEvent.click(missionButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Must run entirely offline without internet.');
    expect(dialog).toHaveTextContent('SQLite and local browser caching.');
    expect(dialog).toHaveTextContent('A working offline browser quiz engine.');

    // Close modal
    const closeBtn = screen.getByRole('button', { name: 'Close modal' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders empty state when no teams match query', async () => {
    challengeApi.fetchTeamsList.mockResolvedValue({
      teams: [],
      total: 0,
      page: 1,
      limit: 100
    });

    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No teams registered yet/i)).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when Dashboard button is clicked', async () => {
    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Dashboard/i });
    fireEvent.click(backBtn);

    expect(window.location.pathname).toBe('/');
  });

  it('rejects deletion when operator token is missing', async () => {
    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete Binary Beasts/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmDeleteBtn = screen.getByRole('button', { name: /Delete Team/i });
    fireEvent.click(confirmDeleteBtn);

    expect(screen.getByText(/Operator authorization token is required/i)).toBeInTheDocument();
    expect(challengeApi.deleteTeamAssignment).not.toHaveBeenCalled();
  });

  it('opens confirmation modal and deletes a team when authorized with operator token', async () => {
    challengeApi.deleteTeamAssignment.mockResolvedValue({
      success: true,
      deletedTeam: { teamName: 'Binary Beasts' }
    });

    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete Binary Beasts/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Delete Team Assignment\?/i)).toBeInTheDocument();
    });

    const tokenInput = screen.getByPlaceholderText(/Enter EVENT_ADMIN_TOKEN/i);
    fireEvent.change(tokenInput, { target: { value: 'operator-token-xyz' } });

    const confirmDeleteBtn = screen.getByRole('button', { name: /Delete Team/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(challengeApi.deleteTeamAssignment).toHaveBeenCalledWith('team-1', 'operator-token-xyz');
      expect(challengeApi.fetchTeamsList).toHaveBeenCalledTimes(2);
    });
  });

  it('renders Print / Export PDF button and triggers window.print when clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    const printBtn = screen.getByRole('button', { name: /Print \/ Export PDF/i });
    expect(printBtn).toBeInTheDocument();

    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it('renders printable allocation report containing IEEE COMPUTER SOCIETY header and full records', async () => {
    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    // Check report header elements
    expect(screen.getByText('IEEE COMPUTER SOCIETY')).toBeInTheDocument();
    expect(screen.getByText('TEAM CHALLENGE ALLOCATION REPORT')).toBeInTheDocument();

    // Check that print container contains full problem and deliverable text without truncation
    expect(screen.getByText('STEM Learning Dropouts')).toBeInTheDocument();
    expect(screen.getByText('High student dropouts in rural STEM learning.')).toBeInTheDocument();
    expect(screen.getByText('A working offline browser quiz engine.')).toBeInTheDocument();
    expect(screen.getByText('Micro-loans fraud in rural cooperatives.')).toBeInTheDocument();
    expect(screen.getByText('A verifiable transaction auditor.')).toBeInTheDocument();
  });

  it('does not render generation timestamps in team rows while preserving team name styling', async () => {
    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
      expect(screen.getByText('Cyber Phoenix')).toBeInTheDocument();
    });

    // Formatted time strings for the mock items
    const time1 = new Date(MOCK_TEAMS_RESPONSE.teams[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const time2 = new Date(MOCK_TEAMS_RESPONSE.teams[1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Assert neither timestamp is rendered anywhere in team rows
    expect(screen.queryByText(time1)).not.toBeInTheDocument();
    expect(screen.queryByText(time2)).not.toBeInTheDocument();

    // Verify team name cells contain team name text and properly styled badges without timestamp subtext
    const binaryBeastsCell = screen.getByText('Binary Beasts').closest('td');
    expect(binaryBeastsCell).toBeInTheDocument();
    expect(binaryBeastsCell).toHaveClass('align-middle');
    expect(binaryBeastsCell).not.toHaveTextContent(time1);

    const cyberPhoenixCell = screen.getByText('Cyber Phoenix').closest('td');
    expect(cyberPhoenixCell).toBeInTheDocument();
    expect(cyberPhoenixCell).toHaveClass('align-middle');
    expect(cyberPhoenixCell).not.toHaveTextContent(time2);
  });

  it('preserves sorting by Newest First and Oldest First using internal createdAt timestamp', async () => {
    render(
      <RouterProvider>
        <TeamsScreen />
      </RouterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Binary Beasts')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Newest First');
    expect(sortSelect).toBeInTheDocument();

    // Sort by Oldest First
    fireEvent.change(sortSelect, { target: { value: 'createdAt-asc' } });
    await waitFor(() => {
      expect(challengeApi.fetchTeamsList).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'createdAt', sortOrder: 'asc' })
      );
    });

    // Sort by Newest First
    fireEvent.change(sortSelect, { target: { value: 'createdAt-desc' } });
    await waitFor(() => {
      expect(challengeApi.fetchTeamsList).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'createdAt', sortOrder: 'desc' })
      );
    });

    // Sort by Team Name (A-Z)
    fireEvent.change(sortSelect, { target: { value: 'teamName-asc' } });
    await waitFor(() => {
      expect(challengeApi.fetchTeamsList).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'teamName', sortOrder: 'asc' })
      );
    });
  });
});
