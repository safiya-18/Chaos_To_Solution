import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamRegistrationInput } from '../components/TeamRegistrationInput.jsx';

describe('TeamRegistrationInput Component', () => {
  it('renders input with label and placeholder', () => {
    render(<TeamRegistrationInput teamName="" onChange={vi.fn()} />);

    expect(screen.getByLabelText(/STEP 1: TEAM NAME/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/e\.g\. Binary Beasts/i);
    expect(input).toBeInTheDocument();
    expect(screen.getByText('0/50')).toBeInTheDocument();
  });

  it('calls onChange when user types team name', () => {
    const handleChange = vi.fn();
    render(<TeamRegistrationInput teamName="" onChange={handleChange} />);

    const input = screen.getByLabelText(/STEP 1: TEAM NAME/i);
    fireEvent.change(input, { target: { value: 'Code Wizards' } });

    expect(handleChange).toHaveBeenCalledWith('Code Wizards');
  });

  it('displays warning when team name is too short (1 character)', () => {
    render(<TeamRegistrationInput teamName="A" onChange={vi.fn()} />);

    expect(screen.getByText(/Team name must be at least 2 characters/i)).toBeInTheDocument();
    const input = screen.getByLabelText(/STEP 1: TEAM NAME/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows valid counter state when team name is valid length', () => {
    render(<TeamRegistrationInput teamName="Cyber Hawks" onChange={vi.fn()} />);

    expect(screen.getByText('11/50')).toBeInTheDocument();
    expect(
      screen.getByText(/Your team name will be registered with your challenge assignment/i)
    ).toBeInTheDocument();
  });

  it('renders backend/registration error message when error prop is provided', () => {
    render(
      <TeamRegistrationInput
        teamName="Duplicate Team"
        onChange={vi.fn()}
        error="Team 'Duplicate Team' is already registered for this event."
      />
    );

    expect(
      screen.getByText("Team 'Duplicate Team' is already registered for this event.")
    ).toBeInTheDocument();
  });

  it('disables input when isDisabled is true', () => {
    render(<TeamRegistrationInput teamName="Team Alpha" onChange={vi.fn()} isDisabled={true} />);

    const input = screen.getByLabelText(/STEP 1: TEAM NAME/i);
    expect(input).toBeDisabled();
  });
});
