import React from 'react';
import { THEMES } from '../data/mockChallenges.js';
import { ThemeCard } from './ThemeCard.jsx';

export function ThemeSelector({ selectedTheme, onSelectTheme, isDisabled }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col select-none">
      {/* ── Step Header ── */}
      <div className="shrink-0 mb-4 xl:mb-5">
        <span className="text-[11.5px] font-black uppercase tracking-[0.18em] text-[#304DB4] block">
          STEP 1
        </span>
        <h2 className="text-[26px] sm:text-[30px] font-black text-[#111820] tracking-tight mt-0.5 leading-tight">
          Select a Theme
        </h2>
        <p className="text-[12.5px] sm:text-[13px] text-[#6B6358] font-normal mt-0.5 leading-snug">
          Choose a domain you're excited about. Each challenge is unique and AI-generated.
        </p>
      </div>

      {/* ── 2-Column Grid (8 themes, 4 rows filling vertical space) ── */}
      <div
        role="radiogroup"
        aria-label="Hackathon Challenge Themes"
        className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 grid-rows-8 sm:grid-rows-4 gap-3 sm:gap-3.5"
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

export default ThemeSelector;
