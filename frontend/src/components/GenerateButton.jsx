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
    <div className="w-full mt-3 sm:mt-4">
      <button
        type="button"
        id="generate-challenge-btn"
        onClick={onClick}
        disabled={!isEnabled}
        className={`w-full relative group py-3 sm:py-3.5 px-5 sm:px-6 rounded-full font-black text-xs sm:text-[13px] tracking-[0.08em] uppercase transition-all duration-200 flex items-center justify-between shadow-lg ${
          isEnabled
            ? 'bg-[#11151C] hover:bg-[#1C222E] text-white cursor-pointer active:scale-[0.99] shadow-[#11151C]/25'
            : 'bg-[#11151C]/40 text-white/50 cursor-not-allowed shadow-none'
        }`}
        aria-busy={isLoading}
        aria-disabled={!isEnabled}
      >
        {/* Left: Yellow 4-point sparkle star or loading spinner */}
        <div className="w-7 sm:w-8 flex items-center justify-start shrink-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE56A] animate-spin" aria-hidden="true" />
          ) : (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE56A] group-hover:rotate-12 transition-transform duration-300"
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
        <span className="text-center font-black flex-1 px-2">
          {isLoading
            ? 'GENERATING CHALLENGE...'
            : hasExistingChallenge
            ? 'GENERATE ANOTHER CHALLENGE'
            : 'GENERATE MY CHALLENGE'}
        </span>

        {/* Right: Circular bright yellow element with dark arrow */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFE56A] flex items-center justify-center text-[#111820] shrink-0 shadow-sm group-hover:translate-x-0.5 transition-transform">
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" aria-hidden="true" />
        </div>
      </button>

      {/* Helpful hint below button */}
      {!selectedTheme && !isLoading && (
        <p className="mt-2 text-center text-xs text-[#78716C] font-medium">
          Choose a theme above to generate your challenge
        </p>
      )}

      {selectedTheme && !isLoading && (
        <p className="mt-2 text-center text-xs text-[#4A453E] font-medium">
          Ready to generate for <span className="text-[#304DB4] font-bold">{selectedTheme}</span>
        </p>
      )}
    </div>
  );
}

export default GenerateButton;
