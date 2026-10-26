import React from 'react';
import { GeometricIllustration } from './GeometricIllustration.jsx';
import { FeatureIndicators } from './FeatureIndicators.jsx';

export function Hero() {
  return (
    <div className="h-full flex flex-col">

      {/* ── TOP: Label + Giant Headline + Body Copy ── */}
      <div className="shrink-0">
        <div className="text-[11px] font-black tracking-[0.22em] text-[#8C8477] uppercase mb-2.5 select-none">
          AI-POWERED BUILD CHALLENGE
        </div>

        <div className="relative">
          <h1
            className="headline-chaos font-black leading-[0.90] select-none"
            style={{ fontSize: 'clamp(44px, 5.8vw, 82px)', letterSpacing: '0.04em' }}
          >
            <span className="block relative inline-block text-[#111820] mb-1 xl:mb-1.5" style={{ letterSpacing: '0.04em' }}>
              CHAOS TO
              {/* Playful sketched doodle & arrow to the right of CHAOS TO */}
              <span className="absolute -top-3.5 -right-16 hidden sm:inline-block pointer-events-none select-none">
                <svg width="56" height="48" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Yellow brush highlight */}
                  <path d="M4 42C16 38 34 38 52 41" stroke="#FFE56A" strokeWidth="6" strokeLinecap="round" />
                  {/* Scribble rays */}
                  <path d="M18 18L14 6" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M26 14L28 2" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M36 17L44 8" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" />
                  {/* Arrow curving down */}
                  <path d="M24 24C34 22 42 26 44 34M44 34L37 32M44 34L43 27" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
            <span className="block text-[#2B43B5]" style={{ letterSpacing: '0.04em' }}>
              SOLUTION.
            </span>
          </h1>

          <p className="mt-3 xl:mt-4 text-[14px] xl:text-[15px] text-[#4A453E] font-medium leading-relaxed">
            One problem. One restriction. One resource.
            <br />
            Build a solution that matters.
          </p>
        </div>
      </div>

      {/* ── CENTER: Illustration (flex-1 so it fills remaining space) ── */}
      <div className="flex-1 min-h-0 flex items-center py-4 xl:py-5">
        <GeometricIllustration />
      </div>

      {/* ── BOTTOM: Stats row ── */}
      <div className="shrink-0 border-t border-[#E2DDD6] pt-3 xl:pt-4">
        <FeatureIndicators />
      </div>
    </div>
  );
}

export default Hero;
