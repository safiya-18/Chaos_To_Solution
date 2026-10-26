import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeSelector } from '../components/ThemeSelector.jsx';

describe('ThemeSelector', () => {
  it('renders all 8 themes', () => {
    render(
      <ThemeSelector
        selectedTheme={null}
        onSelectTheme={() => {}}
        isDisabled={false}
      />
    );

    expect(screen.getByRole('radio', { name: /EdTech/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /FinTech/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /HealthTech/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Sustainability/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Smart Cities/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Accessibility/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /E-commerce/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Open Innovation/i })).toBeInTheDocument();
  });

  it('calls onSelectTheme when a theme card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ThemeSelector
        selectedTheme={null}
        onSelectTheme={handleSelect}
        isDisabled={false}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: /FinTech/i }));
    expect(handleSelect).toHaveBeenCalledWith('FinTech');
  });

  it('marks selected theme with aria-checked="true"', () => {
    render(
      <ThemeSelector
        selectedTheme="HealthTech"
        onSelectTheme={() => {}}
        isDisabled={false}
      />
    );

    const selectedBtn = screen.getByRole('radio', { name: /HealthTech/i });
    expect(selectedBtn).toHaveAttribute('aria-checked', 'true');

    const unselectedBtn = screen.getByRole('radio', { name: /EdTech/i });
    expect(unselectedBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('disables all theme cards when isDisabled is true', () => {
    render(
      <ThemeSelector
        selectedTheme="EdTech"
        onSelectTheme={() => {}}
        isDisabled={true}
      />
    );

    const edtechBtn = screen.getByRole('radio', { name: /EdTech/i });
    expect(edtechBtn).toBeDisabled();
  });
});
