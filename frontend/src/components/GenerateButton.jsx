import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export function GenerateButton({
  onClick,
  isLoading,
  selectedTheme,
  hasExistingChallenge = false
}) {
  const isEnabled = Boolean(selectedTheme) && !isLoading;

  return (
    <div className="w-full">
      <button
        type="button"
        id="generate-challenge-btn"
        onClick={onClick}
        disabled={!isEnabled}
        className={`w-full relative group h-13 sm:h-14 min-h-[48px] px-5 sm:px-6 rounded-full font-black text-xs sm:text-[13px] tracking-[0.08em] uppercase transition-all duration-200 flex items-center justify-between shadow-lg select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE56A] ${
          isEnabled
            ? 'bg-[#11151C] hover:bg-[#1C222E] text-white cursor-pointer active:scale-[0.98] shadow-[#11151C]/25'
            : isLoading
            ? 'bg-[#11151C] text-white cursor-wait'
            : 'bg-[#11151C]/60 text-white/60 cursor-not-allowed shadow-none'
        }`}
        aria-busy={isLoading}
        aria-disabled={!isEnabled}
      >
        {/* Left: Yellow 4-point sparkle star or loading spinner */}
        <div className="w-8 flex items-center justify-start shrink-0">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-[#FFE56A] animate-spin" aria-hidden="true" />
          ) : (
            <svg
              className="w-4.5 h-4.5 text-[#FFE56A] group-hover:rotate-12 transition-transform duration-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 2L13.8 8.8L20 12L13.8 15.2L12 22L10.2 15.2L4 12L10.2 8.8L12 2Z" />
            </svg>
          )}
        </div>

        {/* Center: Button Text */}
        <span className="text-center font-black flex-1 px-2 tracking-[0.08em]">
          {isLoading
            ? 'GENERATING CHALLENGE...'
            : hasExistingChallenge
            ? 'GENERATE ANOTHER CHALLENGE'
            : 'GENERATE MY CHALLENGE'}
        </span>

        {/* Right: Circular bright yellow element with dark arrow */}
        <div className="w-8 h-8 rounded-full bg-[#FFE56A] flex items-center justify-center text-[#111820] shrink-0 shadow-xs group-hover:translate-x-0.5 transition-transform">
          <ArrowRight className="w-4 h-4 stroke-[3]" aria-hidden="true" />
        </div>
      </button>

      {/* Helpful hint below button */}
      {!selectedTheme && !isLoading && (
        <p className="mt-1 text-center text-[10.5px] sm:text-[11.5px] text-[#78716C] font-medium">
          Choose a theme above to generate your challenge
        </p>
      )}

      {selectedTheme && !isLoading && (
        <p className="mt-1 text-center text-[10.5px] sm:text-[11.5px] text-[#4A453E] font-medium">
          Ready to generate for <span className="text-[#304DB4] font-bold">{selectedTheme}</span>
        </p>
      )}
    </div>
  );
}

export default GenerateButton;
