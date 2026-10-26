import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LOADING_STEPS = [
  'Querying challenge constraint engine...',
  'Synthesizing real-world problem statement...',
  'Calibrating technical restriction...',
  'Attaching developer resource & deliverable spec...'
];

export function LoadingState({ theme }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-30 bg-white/95 backdrop-blur-xs rounded-[28px] p-6 xl:p-8 flex flex-col items-center justify-center text-center animate-fade-in"
    >
      <div className="w-full max-w-md p-6 sm:p-7 rounded-2xl bg-white border-2 border-[#11151C] text-center shadow-xl">
        <div className="flex flex-col items-center">
          <div className="w-13 h-13 rounded-full bg-[#FFE56A] border-2 border-[#11151C] flex items-center justify-center text-[#11151C] mb-3.5 shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin stroke-[2.5]" />
          </div>

          <h3 className="text-base sm:text-lg font-black text-[#111820] tracking-tight">
            Generating {theme} Challenge
          </h3>

          <p className="mt-1.5 text-xs font-mono text-[#304DB4] font-semibold min-h-[20px] transition-all">
            {LOADING_STEPS[stepIndex]}
          </p>

          {/* 4-card skeleton placeholders */}
          <div className="mt-5 grid grid-cols-2 gap-3 w-full text-left">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[#F7F3EA] border border-[#11151C]/15 animate-pulse"
              >
                <div className="w-14 h-3 bg-[#E0D8C8] rounded mb-2" />
                <div className="w-3/4 h-3.5 bg-[#D5CCB8] rounded mb-2" />
                <div className="w-full h-2 bg-[#E5DEC7] rounded mb-1" />
                <div className="w-4/5 h-2 bg-[#E5DEC7] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
