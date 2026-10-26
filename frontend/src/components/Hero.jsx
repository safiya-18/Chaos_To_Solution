import React from 'react';
import { GeometricIllustration } from './GeometricIllustration.jsx';
import { FeatureIndicators } from './FeatureIndicators.jsx';

export function Hero() {
  return (
    <div className="flex flex-col justify-between h-full space-y-4 lg:space-y-5 lg:pr-2">
      {/* Top Header Block */}
      <div>
        {/* Category Badge */}
        <div className="text-[11px] font-black tracking-[0.2em] text-[#8C8477] uppercase mb-1.5 select-none">
          AI-POWERED BUILD CHALLENGE
        </div>

        {/* Main Display Headline with doodle */}
        <div className="relative">
          <h1 className="headline-chaos text-[48px] sm:text-[68px] lg:text-[74px] xl:text-[80px] font-black tracking-[-0.03em] leading-[0.88] text-[#111820] select-none">
            <span className="block relative inline-block">
              CHAOS TO
              {/* Playful sketched doodle & arrow to the right of CHAOS TO */}
              <span className="absolute -top-3 -right-16 hidden sm:inline-block pointer-events-none select-none">
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
          <p className="mt-3 text-sm sm:text-[15.5px] text-[#4A453E] font-medium leading-snug max-w-md">
            One problem. One restriction. One resource.
            <br className="hidden sm:inline" />
            Build a solution that matters.
          </p>
        </div>
      </div>

      {/* Center: Abstract Geometric Illustration */}
      <div className="my-auto py-2">
        <GeometricIllustration />
      </div>

      {/* Bottom: Feature Indicators */}
      <div className="pt-2 border-t border-[#E8E2D8]/80">
        <FeatureIndicators />
      </div>
    </div>
  );
}
