import React from 'react';
import { Terminal } from 'lucide-react';

export function Header({ isMockMode, onToggleMockMode }) {
  return (
    <header className="border-b border-[#1e2638] bg-[#090b10]/90 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Organization */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Terminal className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                CHAOS TO SOLUTION
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                AI-POWERED BUILD CHALLENGE
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] flex items-center gap-1.5 font-medium">
              <span>IEEE Computer Society</span>
              <span className="text-[#475569]">•</span>
              <span>SJC Institute of Technology</span>
            </p>
          </div>
        </div>

        {/* Right side status / Mock Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMockMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all border ${
              isMockMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
            title="Toggle between Live Backend API and Standalone Mock Mode"
            aria-label={`Toggle mock mode: currently ${isMockMode ? 'Mock Data' : 'Live Backend'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isMockMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
              }`}
              aria-hidden="true"
            />
            <span>{isMockMode ? 'MOCK MODE' : 'LIVE API'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
