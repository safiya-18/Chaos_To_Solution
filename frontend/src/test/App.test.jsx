import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App.jsx';

describe('App Component Integration Flow', () => {
  beforeEach(() => {
    // Mock scrollIntoView and scrollTo in jsdom
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
  });

  it('renders initial Screen 1 state with Generate button disabled until a theme is selected', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/CHAOS TO/i);
    expect(heading).toHaveTextContent(/SOLUTION/i);
    expect(screen.getByText(/One problem\. One restriction\. One resource\./i)).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /GENERATE MY CHALLENGE/i });
    expect(generateBtn).toBeDisabled();
    expect(
      screen.getByText(/Choose a theme above to generate your challenge/i)
    ).toBeInTheDocument();
  });

  it('enables the Generate button after selecting a theme', () => {
    render(<App />);

    const fintechCard = screen.getByRole('radio', { name: /FinTech/i });
    fireEvent.click(fintechCard);

    const generateBtn = screen.getByRole('button', { name: /GENERATE MY CHALLENGE/i });
    expect(generateBtn).not.toBeDisabled();
    expect(screen.getByText(/Ready to generate for/i)).toBeInTheDocument();
  });

  it('generates challenge, navigates to Screen 2, flips cards, tests WhatsApp form, and returns Back to Themes', async () => {
    render(<App />);

    // Select EdTech
    const edtechCard = screen.getByRole('radio', { name: /EdTech/i });
    fireEvent.click(edtechCard);

    // Click Generate Challenge
    const generateBtn = screen.getByRole('button', { name: /GENERATE MY CHALLENGE/i });
    fireEvent.click(generateBtn);

    // Wait for Screen 2 to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Your Challenge/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Problem Statement' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Restrictions' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Resources' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify theme badge and source indicator
    expect(screen.getByText(/EdTech Challenge/i)).toBeInTheDocument();
    expect(screen.getByText(/(AI Generated|Backup Challenge)/i)).toBeInTheDocument();

    // Verify card flip interaction: clicking Problem Statement card reveals content
    const problemCard = screen.getByRole('button', { name: 'Problem Statement card' });
    fireEvent.click(problemCard);

    // Content should now be revealed
    expect(screen.getByText(/Distraction-Free Audio Flashcard/i)).toBeInTheDocument();

    // Verify WhatsApp form is rendered
    expect(screen.getByRole('heading', { name: /Share Your Mission/i })).toBeInTheDocument();
    const phoneInput = screen.getByLabelText(/10-digit Indian mobile number/i);
    const shareBtn = screen.getByRole('button', { name: /SHARE VIA WHATSAPP/i });
    expect(shareBtn).toBeDisabled();

    // Type invalid phone number
    fireEvent.change(phoneInput, { target: { value: '123' } });
    expect(shareBtn).toBeDisabled();
    expect(screen.getByText(/Please enter a valid 10-digit mobile number/i)).toBeInTheDocument();

    // Type valid phone number
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    expect(shareBtn).not.toBeDisabled();
    expect(screen.getByText(/Valid number/i)).toBeInTheDocument();

    // Click Back to Themes button to return to Screen 1
    const backBtn = screen.getByRole('button', { name: /Back to Themes/i });
    fireEvent.click(backBtn);

    // Screen 1 should be restored with EdTech still selected
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/CHAOS TO/i);
    const restoredEdtech = screen.getByRole('radio', { name: /EdTech/i });
    expect(restoredEdtech).toHaveAttribute('aria-checked', 'true');
  });
});
