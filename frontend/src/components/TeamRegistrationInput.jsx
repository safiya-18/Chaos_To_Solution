import React from 'react';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';

export function TeamRegistrationInput({
  teamName,
  onChange,
  isDisabled = false,
  error = null
}) {
  const trimmed = (teamName || '').trim();
  const isValidLength = trimmed.length >= 2 && trimmed.length <= 50;
  const isTooShort = trimmed.length > 0 && trimmed.length < 2;

  return (
    <div className="w-full shrink-0">
      {/* ── Section Header matching mockup ── */}
      <div className="flex items-start justify-between mb-2 select-none">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#304DB4] block leading-none">
            GET YOUR CHALLENGE
          </span>
          <h2 className="text-[20px] sm:text-[23px] font-black text-[#111820] tracking-tight mt-1 leading-tight">
            Enter your team name
          </h2>
          <p className="text-[11.5px] sm:text-[12px] text-[#6B6358] font-normal mt-0.5 leading-tight">
            Use your assigned team name to generate your unique challenge.
          </p>
        </div>

        <span
          className={`text-[11px] font-mono mt-1 ${
            trimmed.length > 50
              ? 'text-red-500 font-bold'
              : isValidLength
              ? 'text-emerald-600 font-semibold'
              : 'text-[#8C8477]'
          }`}
        >
          {trimmed.length}/50
        </span>
      </div>

      <div className="relative">
        {/* Left Users Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8477] pointer-events-none">
          <Users className="w-4.5 h-4.5 stroke-[2]" aria-hidden="true" />
        </div>

        <label htmlFor="team-name-input" className="sr-only">
          STEP 1: TEAM NAME
        </label>

        <input
          id="team-name-input"
          aria-label="STEP 1: TEAM NAME"
          type="text"
          value={teamName}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          maxLength={55}
          placeholder="e.g. Binary Beasts, Team Phoenix..."
          className={`w-full h-12 pl-10 pr-10 rounded-2xl text-sm font-semibold text-[#111820] bg-[#F7F3EA]/60 border transition-all duration-200 placeholder:text-[#8C8477]/70 placeholder:font-normal focus-visible:outline-none focus-visible:bg-white focus-visible:ring-2 ${
            error
              ? 'border-red-400 bg-red-50/40 focus-visible:ring-red-400'
              : isValidLength
              ? 'border-emerald-500/60 focus-visible:ring-[#FFE56A]'
              : 'border-[#11151C]/15 focus-visible:ring-[#FFE56A]'
          } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          aria-invalid={Boolean(error) || isTooShort}
          aria-describedby="team-name-hint"
        />

        {/* Right validation indicator icon */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {isValidLength && !error ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          ) : error || isTooShort ? (
            <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
          ) : null}
        </div>
      </div>

      {/* Helper / Error Text */}
      <div id="team-name-hint" className="mt-1 min-h-[16px] text-[11px] leading-tight">
        {error ? (
          <p className="text-red-600 font-medium flex items-center gap-1">
            <span>{error}</span>
          </p>
        ) : isTooShort ? (
          <p className="text-amber-700 font-medium">Team name must be at least 2 characters.</p>
        ) : (
          <p className="text-[#6B6358]">Your team name will be registered with your challenge assignment.</p>
        )}
      </div>
    </div>
  );
}

export default TeamRegistrationInput;
