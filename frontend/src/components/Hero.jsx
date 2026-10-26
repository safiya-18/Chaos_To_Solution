import React from 'react';
import { GeometricIllustration } from './GeometricIllustration.jsx';
import { FeatureIndicators } from './FeatureIndicators.jsx';

export function Hero() {
  return (
    <div className="flex flex-col justify-between h-full space-y-3 sm:space-y-4 lg:pr-3">
      {/* Top Header Block */}
      <div>
        {/* Category Badge */}
        <div className="text-[10px] sm:text-[11px] font-black tracking-[0.2em] text-[#8C8477] uppercase mb-1 select-none">
          AI-POWERED BUILD CHALLENGE
        </div>

        {/* Main Display Headline with doodle and intentional vertical gap */}
        <div className="relative">
          <h1 className="headline-chaos text-[38px] sm:text-[52px] md:text-[46px] lg:text-[56px] xl:text-[70px] font-black tracking-[-0.03em] leading-[0.9] text-[#111820] select-none flex flex-col">
            <span className="block relative inline-block mb-1 sm:mb-1.5 xl:mb-2">
              CHAOS TO
              {/* Playful sketched doodle & arrow to the right of CHAOS TO */}
              <span className="absolute -top-2.5 -right-11 sm:-right-13 xl:-right-15 hidden sm:inline-block pointer-events-none select-none scale-75 sm:scale-85 xl:scale-100 origin-bottom-left">
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
            <span className="block text-[#304DB4]">
              SOLUTION.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-2 sm:mt-2.5 text-xs sm:text-[14px] text-[#4A453E] font-medium leading-snug max-w-sm sm:max-w-md">
            One problem. One restriction. One resource.
            <br className="hidden sm:inline" />
            Build a solution that matters.
          </p>
        </div>
      </div>

      {/* Center: Abstract Geometric Illustration */}
      <div className="my-auto py-1 sm:py-2">
        <GeometricIllustration />
      </div>

      {/* Bottom: Feature Indicators */}
      <div className="pt-2 border-t border-[#E8E2D8]/80">
        <FeatureIndicators />
      </div>
    </div>
  );
}

export default Hero;
