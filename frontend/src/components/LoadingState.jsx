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
      className="w-full my-6 p-6 rounded-2xl bg-white border-2 border-[#11151C] text-center shadow-md relative overflow-hidden"
    >
      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[#FFE56A] border-2 border-[#11151C] flex items-center justify-center text-[#11151C] mb-3 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin stroke-[2.5]" />
        </div>

        <h3 className="text-base font-extrabold text-[#111820] tracking-tight">
          Generating {theme} Challenge
        </h3>

        <p className="mt-1.5 text-xs font-mono text-[#304DB4] font-medium min-h-[20px] transition-all">
          {LOADING_STEPS[stepIndex]}
        </p>

        {/* 4-card skeleton placeholders */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#F7F3EA] border border-[#11151C]/20 animate-pulse"
            >
              <div className="w-16 h-4 bg-[#E0D8C8] rounded mb-2" />
              <div className="w-3/4 h-5 bg-[#D5CCB8] rounded mb-2" />
              <div className="w-full h-3 bg-[#E5DEC7] rounded mb-1.5" />
              <div className="w-4/5 h-3 bg-[#E5DEC7] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
