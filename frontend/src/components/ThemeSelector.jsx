import React from 'react';
import { THEMES } from '../data/mockChallenges.js';
import { ThemeCard } from './ThemeCard.jsx';

export function ThemeSelector({ selectedTheme, onSelectTheme, isDisabled }) {
  return (
    <div className="w-full">
      {/* Step Header */}
      <div className="mb-3.5 sm:mb-4 select-none">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#304DB4] block">
          STEP 1
        </span>
        <h2 className="text-2xl sm:text-[26px] font-black text-[#111820] tracking-tight mt-0.5">
          Select a Theme
        </h2>
        <p className="text-xs sm:text-[13px] text-[#6B6358] font-normal mt-1 leading-snug">
          Choose a domain you're excited about. Each challenge is unique and AI-generated.
        </p>
      </div>

      {/* 2-Column Theme Cards Grid */}
      <div
        role="radiogroup"
        aria-label="Hackathon Challenge Themes"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3"
      >
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.name}
            isDisabled={isDisabled}
            onSelect={onSelectTheme}
          />
        ))}
      </div>
    </div>
  );
}
