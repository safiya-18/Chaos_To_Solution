import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export function ErrorState({ error, onRetry, isRetrying }) {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'An unexpected issue occurred while generating the challenge.';

  return (
    <div
      role="alert"
      className="w-full my-6 p-6 rounded-2xl bg-[#FEE2E2] border-2 border-[#11151C] text-center shadow-md"
    >
      <div className="w-12 h-12 rounded-full bg-white border-2 border-[#11151C] flex items-center justify-center text-[#DC2626] mx-auto mb-3 shadow-xs">
        <AlertCircle className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
      </div>

      <h3 className="text-base font-extrabold text-[#111820]">
        Challenge Generation Failed
      </h3>

      <p className="mt-1.5 text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed">
        {errorMessage}
      </p>

      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="px-5 py-2.5 rounded-full bg-[#11151C] hover:bg-[#1E2530] text-white text-xs font-bold tracking-wide transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isRetrying ? 'Retrying...' : 'Retry Generation'}</span>
        </button>
      </div>
    </div>
  );
}
