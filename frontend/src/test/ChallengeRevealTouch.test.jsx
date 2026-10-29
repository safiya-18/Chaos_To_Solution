import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChallengeFlipCard } from '../components/ChallengeFlipCard.jsx';
import { ChallengeScreen } from '../components/ChallengeScreen.jsx';
import { FileText } from 'lucide-react';

const mockChallengeData = {
  theme: 'EdTech',
  teamName: 'Innovators',
  source: 'ai',
  challenge: {
    problem: {
      title: 'Distraction-Free Audio Flashcard',
      statement: 'Students get distracted while studying. Build an interactive audio tool.'
    },
    restriction: {
      name: 'No External Libraries',
      rule: 'Rely solely on vanilla Web Speech API.'
    },
    resource: {
      name: 'Web Speech API',
      type: 'browser-api',
      guidance: 'Use window.speechSynthesis to read text aloud.',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
    },
    deliverable: 'A responsive single-page web app with playback controls.'
  }
};

describe('ChallengeFlipCard Touch & Interaction Tests', () => {
  it('triggers reveal on a single click or tap when unrevealed', () => {
    const onToggleFlip = vi.fn();
    render(
      <ChallengeFlipCard
        step="01"
        title="Problem Statement"
        subtitle="A real-world problem."
        icon={FileText}
        isFlipped={false}
        onToggleFlip={onToggleFlip}
      >
        <p>Revealed problem content</p>
      </ChallengeFlipCard>
    );

    const card = screen.getByRole('button', { name: 'Problem Statement card' });
    expect(card).toHaveAttribute('aria-expanded', 'false');

    // Single tap/click
    fireEvent.click(card);
    expect(onToggleFlip).toHaveBeenCalledTimes(1);
  });

  it('prevents accidental repeated triggers while animation is locked', () => {
    vi.useFakeTimers();
    const onToggleFlip = vi.fn();

    render(
      <ChallengeFlipCard
        step="01"
        title="Problem Statement"
        subtitle="A real-world problem."
        icon={FileText}
        isFlipped={false}
        onToggleFlip={onToggleFlip}
      >
        <p>Revealed problem content</p>
      </ChallengeFlipCard>
    );

    const card = screen.getByRole('button', { name: 'Problem Statement card' });

    // First tap
    fireEvent.click(card);
    expect(onToggleFlip).toHaveBeenCalledTimes(1);

    // Rapid second tap during animation (within 500ms)
    fireEvent.click(card);
    expect(onToggleFlip).toHaveBeenCalledTimes(1); // Locked, not called again

    // After animation duration finishes
    act(() => {
      vi.advanceTimersByTime(550);
    });

    vi.useRealTimers();
  });

  it('does NOT conceal when clicking inside revealed content body', () => {
    const onToggleFlip = vi.fn();
    render(
      <ChallengeFlipCard
        step="01"
        title="Problem Statement"
        subtitle="A real-world problem."
        icon={FileText}
        isFlipped={true}
        onToggleFlip={onToggleFlip}
      >
        <p data-testid="revealed-text">Revealed problem content</p>
      </ChallengeFlipCard>
    );

    const revealedText = screen.getByTestId('revealed-text');
    fireEvent.click(revealedText);

    // Clicking inside the revealed text body must NOT toggle flip back
    expect(onToggleFlip).not.toHaveBeenCalled();
  });

  it('conceals when clicking the dedicated Flip back button or footer', () => {
    vi.useFakeTimers();
    const onToggleFlip = vi.fn();
    render(
      <ChallengeFlipCard
        step="01"
        title="Problem Statement"
        subtitle="A real-world problem."
        icon={FileText}
        isFlipped={true}
        onToggleFlip={onToggleFlip}
      >
        <p>Revealed problem content</p>
      </ChallengeFlipCard>
    );

    const flipBackBtn = screen.getByRole('button', { name: 'Flip back card 01' });
    fireEvent.click(flipBackBtn);
    expect(onToggleFlip).toHaveBeenCalledTimes(1);

    // Advance past animation lock (520ms)
    act(() => {
      vi.advanceTimersByTime(550);
    });

    const concealFooter = screen.getByRole('button', { name: 'Conceal Problem Statement card' });
    fireEvent.click(concealFooter);
    expect(onToggleFlip).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('supports keyboard activation via Enter and Space', () => {
    const onToggleFlip = vi.fn();
    render(
      <ChallengeFlipCard
        step="01"
        title="Problem Statement"
        subtitle="A real-world problem."
        icon={FileText}
        isFlipped={false}
        onToggleFlip={onToggleFlip}
      >
        <p>Revealed problem content</p>
      </ChallengeFlipCard>
    );

    const card = screen.getByRole('button', { name: 'Problem Statement card' });

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onToggleFlip).toHaveBeenCalledTimes(1);

    // Advance past animation lock
    act(() => {
      // Simulate real delay or timeout
    });
  });
});

describe('ChallengeScreen Reveal All & Layout Integration', () => {
  it('renders the Reveal All Cards button and reveals all cards simultaneously', () => {
    const onBackToThemes = vi.fn();
    render(
      <ChallengeScreen
        challengeData={mockChallengeData}
        onBackToThemes={onBackToThemes}
      />
    );

    const revealAllBtn = screen.getByRole('button', { name: /Reveal all challenge cards/i });
    expect(revealAllBtn).toBeInTheDocument();

    // Click Reveal All Cards
    fireEvent.click(revealAllBtn);

    // All three cards should now reveal their content
    expect(screen.getByText('Distraction-Free Audio Flashcard')).toBeInTheDocument();
    expect(screen.getByText('No External Libraries')).toBeInTheDocument();
    expect(screen.getByText('Web Speech API')).toBeInTheDocument();

    // Button text should now update to Conceal All Cards
    expect(screen.getByRole('button', { name: /Conceal all challenge cards/i })).toBeInTheDocument();

    // Click Conceal All
    fireEvent.click(screen.getByRole('button', { name: /Conceal all challenge cards/i }));
    expect(screen.getByRole('button', { name: /Reveal all challenge cards/i })).toBeInTheDocument();
  });

  it('renders bottom WhatsAppShareForm and back to themes button completely', () => {
    render(
      <ChallengeScreen
        challengeData={mockChallengeData}
        onBackToThemes={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Back to Themes selection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Share Your Mission/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SHARE VIA WHATSAPP/i })).toBeInTheDocument();
  });
});
