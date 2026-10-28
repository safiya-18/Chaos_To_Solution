import React from 'react';
import { THEMES } from '../data/mockChallenges.js';
import { ThemeCard } from './ThemeCard.jsx';

export function ThemeSelector({ selectedTheme, onSelectTheme, isDisabled }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* ── Step Header ── */}
      <div className="shrink-0 mb-2.5 xl:mb-3 select-none">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#304DB4] block">
          STEP 1
        </span>
        <h2 className="text-[22px] xl:text-[27px] 2xl:text-[30px] font-black text-[#111820] tracking-tight mt-0.5 leading-tight">
          Select a Theme
        </h2>
        <p className="text-[12px] xl:text-[13px] text-[#6B6358] font-normal mt-0.5 leading-snug">
          Choose a domain you're excited about. Each challenge is unique and AI-generated.
        </p>
      </div>

      {/* ── 2×4 Grid — responsive: 1 col on mobile, 2×4 on sm+ ── */}
      <div
        role="radiogroup"
        aria-label="Hackathon Challenge Themes"
        className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 sm:[grid-template-rows:repeat(4,1fr)] gap-2 xl:gap-2.5"
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
