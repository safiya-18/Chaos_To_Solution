import React from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';

const COLOR_CONFIG = {
  lavender: {
    bg: '#E5D4FA',
    shadowLayer: '#D3C0EE',
    border: 'border-[#CDBBE8]',
    iconBg: '#F2E9FD',
    accent: '#4C1D95',
  },
  yellow: {
    bg: '#FFF0B8',
    shadowLayer: '#F9DC62',
    border: 'border-[#F6DF84]',
    iconBg: '#FEF9C3',
    accent: '#78350F',
  },
  blue: {
    bg: '#CDE7FB',
    shadowLayer: '#9ED0F7',
    border: 'border-[#B4E1FA]',
    iconBg: '#E0F2FE',
    accent: '#0369A1',
  },
};

export function ChallengeFlipCard({
  step,
  title,
  subtitle,
  colorScheme = 'lavender',
  icon: IconComponent,
  frontHint = 'Click to reveal',
  isFlipped,
  onToggleFlip,
  children,
}) {
  const config = COLOR_CONFIG[colorScheme] || COLOR_CONFIG.lavender;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleFlip();
    }
  };

  return (
    <div
      id={`flip-card-${step}`}
      className="relative w-full group perspective-1000 select-none cursor-pointer"
      role="button"
      tabIndex={0}
      aria-expanded={isFlipped}
      aria-label={`${title} card`}
      onClick={onToggleFlip}
      onKeyDown={handleKeyDown}
    >
      {/* Underlying tactile offset layer (gives layered card depth like the reference) */}
      <div
        className="absolute inset-0 translate-y-2 rounded-[28px] sm:rounded-[32px] border-2 border-[#11151C]/15 transition-transform duration-300 group-hover:translate-y-3"
        style={{ backgroundColor: config.shadowLayer }}
        aria-hidden="true"
      />

      {/* 3D Flip Card Inner Container */}
      <div
        className={`flip-card-inner relative w-full min-h-[400px] sm:min-h-[440px] rounded-[28px] sm:rounded-[32px] transition-transform duration-700 ease-in-out preserve-3d border-2 border-[#11151C]/20 shadow-md ${
          isFlipped ? 'rotate-y-180' : ''
        } group-hover:-translate-y-0.5`}
        style={{ backgroundColor: config.bg }}
      >
        {/* ======================================================== */}
        {/* FRONT FACE (Concealed State) */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 w-full h-full p-6 sm:p-7 flex flex-col justify-between rounded-[28px] sm:rounded-[32px] backface-hidden"
          style={{ backgroundColor: config.bg }}
        >
          {/* Top Row: Step Number */}
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-[#111820] tracking-tight">
              {step}
            </span>
          </div>

          {/* Center: Icon, Title, and Subtitle */}
          <div className="flex flex-col items-center text-center my-auto px-2">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-[#111820] border border-[#111820]/15 shadow-sm mb-4 transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: config.iconBg }}
            >
              {IconComponent && <IconComponent className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2]" aria-hidden="true" />}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#111820] tracking-tight leading-snug">
              {title}
            </h3>

            <p className="text-xs sm:text-[13.5px] text-[#524B43] font-medium leading-relaxed mt-1.5 max-w-[220px]">
              {subtitle}
            </p>
          </div>

          {/* Bottom Pill: Click to reveal */}
          <div className="w-full">
            <div className="w-full py-2.5 px-4 rounded-full bg-white border border-[#11151C]/15 shadow-xs flex items-center justify-between text-xs sm:text-sm font-bold text-[#111820] transition-all group-hover:border-[#111820]/40 group-hover:shadow-sm">
              <span>{frontHint}</span>
              <div className="w-6 h-6 rounded-full border border-[#111820]/40 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BACK FACE (Revealed State) */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 w-full h-full p-5 sm:p-6 flex flex-col justify-between rounded-[28px] sm:rounded-[32px] backface-hidden rotate-y-180 overflow-y-auto"
          style={{ backgroundColor: config.bg }}
        >
          {/* Top Bar: Step + Title Label & Flip Back Button */}
          <div className="flex items-center justify-between pb-3 border-b border-[#11151C]/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-[#11151C] text-white">
                {step}
              </span>
              <span className="text-xs font-extrabold tracking-wider uppercase text-[#111820]/80">
                {step} Details
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFlip();
              }}
              title="Flip back to front"
              aria-label={`Flip back card ${step}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-xs font-bold text-[#111820] border border-[#111820]/15 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span className="hidden sm:inline">Flip back</span>
            </button>
          </div>

          {/* Middle: Revealed Content Body */}
          <div className="flex-1 my-3 pr-1 text-left select-text">
            {children}
          </div>

          {/* Bottom: Subtle conceal footer */}
          <div className="pt-2 border-t border-[#11151C]/10 flex items-center justify-between text-[11px] text-[#6B6358] font-semibold shrink-0">
            <span>Tap card to conceal</span>
            <RotateCw className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChallengeFlipCard;
