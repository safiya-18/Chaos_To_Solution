import React from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';

const COLOR_CONFIG = {
  lavender: {
    bg: '#E5D4FA',
    shadowLayer: '#CDB9ED',
    border: 'border-[#CDBBE8]',
    iconBg: '#F2E9FD',
    accent: '#5B21B6',
  },
  yellow: {
    bg: '#FFF0B8',
    shadowLayer: '#F0D64F',
    border: 'border-[#F6DF84]',
    iconBg: '#FEF9C3',
    accent: '#92400E',
  },
  blue: {
    bg: '#C8E8FB',
    shadowLayer: '#8DCDF4',
    border: 'border-[#A8D8F7]',
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
  frontHint = 'Tap or click to reveal',
  isFlipped,
  onToggleFlip,
  children,
}) {
  const config = COLOR_CONFIG[colorScheme] || COLOR_CONFIG.lavender;
  const isAnimatingRef = React.useRef(false);

  // Single tap / click reveals unrevealed card without requiring precise pointer positioning
  const handleTriggerFlip = () => {
    if (isFlipped) return; // Prevent accidental concealment while reading/scrolling content
    if (isAnimatingRef.current) return; // Prevent accidental rapid repeated triggers
    isAnimatingRef.current = true;
    onToggleFlip();
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 520);
  };

  const handleFlipBack = (e) => {
    if (e) e.stopPropagation();
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    onToggleFlip();
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 520);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isFlipped) {
        handleTriggerFlip();
      } else {
        handleFlipBack();
      }
    }
  };

  return (
    /* Responsive min-height with flexible growth — readable on smartboard & landscape tablet */
    <div
      id={`flip-card-${step}`}
      className={`relative w-full min-h-[380px] md:min-h-[400px] xl:min-h-[440px] md:h-full group perspective-1000 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111820] rounded-[24px] xl:rounded-[28px] ${
        isFlipped ? 'cursor-default' : 'cursor-pointer'
      }`}
      role="button"
      tabIndex={0}
      aria-expanded={isFlipped}
      aria-label={`${title} card`}
      onClick={handleTriggerFlip}
      onKeyDown={handleKeyDown}
    >
      {/* Tactile shadow layer — shifted down-right to create depth */}
      <div
        className="absolute inset-0 translate-y-2 xl:translate-y-2.5 translate-x-1 rounded-[24px] xl:rounded-[28px] border-2 border-[#11151C]/12 transition-transform duration-300 group-hover:translate-y-3 pointer-events-none"
        style={{ backgroundColor: config.shadowLayer }}
        aria-hidden="true"
      />

      {/* 3-D Flip Inner — 500ms snappy transition, active scale for tactile tap feedback */}
      <div
        className={`flip-card-inner relative w-full h-full rounded-[24px] xl:rounded-[28px] transition-transform duration-500 ease-in-out preserve-3d border-2 border-[#11151C]/18 shadow-md ${
          isFlipped ? 'rotate-y-180' : ''
        } ${!isFlipped ? 'group-hover:-translate-y-0.5 active:scale-[0.99]' : ''}`}
        style={{ backgroundColor: config.bg }}
      >

        {/* ── FRONT FACE: pointer-events active only when not flipped ── */}
        <div
          className={`absolute inset-0 w-full h-full p-5 xl:p-6 flex flex-col justify-between rounded-[24px] xl:rounded-[28px] backface-hidden ${
            isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          style={{ backgroundColor: config.bg }}
        >
          {/* Step number — top-left, accent colored */}
          <div className="shrink-0 mb-auto">
            <span
              className="text-[17px] xl:text-[20px] font-black tracking-tight"
              style={{ color: config.accent }}
            >
              {step}
            </span>
          </div>

          {/* Center content: icon + title + subtitle */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-3">
            {/* Large icon circle */}
            <div
              className="w-16 h-16 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 rounded-full flex items-center justify-center text-[#111820] border border-[#11151C]/12 shadow-sm mb-3 xl:mb-4 transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: config.iconBg }}
            >
              {IconComponent && (
                <IconComponent
                  className="w-7 h-7 xl:w-9 xl:h-9 2xl:w-11 2xl:h-11 stroke-[1.7]"
                  aria-hidden="true"
                />
              )}
            </div>

            <h3 className="text-[18px] xl:text-[22px] 2xl:text-[26px] font-black text-[#111820] tracking-tight leading-tight">
              {title}
            </h3>

            <p className="text-xs xl:text-[13px] text-[#524B43] font-medium leading-snug mt-1.5 max-w-[200px]">
              {subtitle}
            </p>
          </div>

          {/* Bottom pill: "Tap or click to reveal" with comfortable touch target */}
          <div className="shrink-0">
            <div className="w-full py-2.5 xl:py-3 px-4 rounded-full bg-white border border-[#11151C]/15 shadow-sm flex items-center justify-between text-[12px] xl:text-[13px] font-bold text-[#111820] transition-all group-hover:border-[#111820]/40 group-hover:shadow-md">
              <span>{frontHint}</span>
              <div className="w-5.5 h-5.5 xl:w-6 xl:h-6 rounded-full border border-[#111820]/35 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
                <ArrowRight className="w-3 h-3 xl:w-3.5 xl:h-3.5 stroke-[2.5]" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* ── BACK FACE: pointer-events active only when flipped ── */}
        <div
          className={`absolute inset-0 w-full h-full p-5 xl:p-6 flex flex-col justify-between rounded-[24px] xl:rounded-[28px] backface-hidden rotate-y-180 ${
            isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          style={{ backgroundColor: config.bg }}
        >
          {/* Top bar: step label + flip-back button */}
          <div className="shrink-0 flex items-center justify-between pb-2.5 border-b border-[#11151C]/12">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#11151C] text-white">
                {step}
              </span>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#111820]/75">
                {title}
              </span>
            </div>

            <button
              type="button"
              onClick={handleFlipBack}
              title="Flip back to front"
              aria-label={`Flip back card ${step}`}
              className="min-h-[36px] sm:min-h-[40px] px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-xs font-bold text-[#111820] border border-[#11151C]/15 transition-all cursor-pointer active:scale-95 touch-manipulation flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip back</span>
            </button>
          </div>

          {/* Revealed content body — scrollable with custom styling */}
          <div className="flex-1 min-h-0 my-3 text-left select-text overflow-y-auto custom-modal-scrollbar pr-1">
            {children}
          </div>

          {/* Conceal footer */}
          <button
            type="button"
            onClick={handleFlipBack}
            className="shrink-0 w-full pt-2 border-t border-[#11151C]/10 flex items-center justify-between text-[11px] text-[#6B6358] hover:text-[#111820] font-semibold cursor-pointer active:scale-95 touch-manipulation transition-colors select-none"
            aria-label={`Conceal ${title} card`}
          >
            <span>Tap to flip back</span>
            <RotateCw className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChallengeFlipCard;
