import React from 'react';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { useRouter } from '../router/Router.jsx';
import { TeamRegistrationInput } from './TeamRegistrationInput.jsx';

export function Hero({ teamName, onTeamNameChange, teamError, isDisabled }) {
  const { navigate } = useRouter();

  return (
    <div className="h-full flex flex-col justify-between py-1">

      {/* ── TOP: Brand & Event Identity ── */}
      <div className="shrink-0">
        <div className="text-[11px] font-black tracking-[0.22em] text-[#8C8477] uppercase mb-2 select-none">
          AI-POWERED BUILD CHALLENGE
        </div>

        <div className="relative">
          <h1
            className="headline-chaos font-black leading-[0.90] select-none"
            style={{ fontSize: 'clamp(38px, 4.5vw, 68px)', letterSpacing: '0.04em' }}
          >
            <span className="block relative inline-block text-[#111820] mb-1" style={{ letterSpacing: '0.04em' }}>
              CHAOS TO
              {/* Playful sketched doodle & arrow to the right of CHAOS TO */}
              <span className="absolute -top-3 -right-14 hidden sm:inline-block pointer-events-none select-none">
                <svg width="52" height="44" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 42C16 38 34 38 52 41" stroke="#FFE56A" strokeWidth="6" strokeLinecap="round" />
                  <path d="M18 18L14 6" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M26 14L28 2" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M36 17L44 8" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M24 24C34 22 42 26 44 34M44 34L37 32M44 34L43 27" stroke="#111820" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
            <span className="block text-[#2B43B5]" style={{ letterSpacing: '0.04em' }}>
              SOLUTION.
            </span>
          </h1>

          <p className="mt-2.5 text-[13px] sm:text-[14px] text-[#4A453E] font-medium leading-snug">
            One problem. One restriction. One resource.
            <br />
            Build a solution that matters.
          </p>
        </div>
      </div>

      {/* ── MIDDLE: Team Name Input Card (Replacing the 3 small cards in the left empty area) ── */}
      <div className="my-3 sm:my-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#11151C]/10 shadow-xs">
          <TeamRegistrationInput
            teamName={teamName}
            onChange={onTeamNameChange}
            isDisabled={isDisabled}
            error={teamError}
          />
        </div>
      </div>

      {/* ── BOTTOM: Two Navigation Action Cards ── */}
      <div className="flex flex-col gap-2.5 sm:gap-3">

        {/* Card 1: Live Event Timer */}
        <button
          type="button"
          onClick={() => navigate('/timer')}
          id="nav-timer-card-btn"
          aria-label="Navigate to Live Event Timer screen"
          className="group w-full p-3.5 sm:p-4 rounded-2xl bg-[#F0F5FF] hover:bg-[#E5EEFF] border border-[#D0E0FF] transition-all duration-200 text-left flex items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99] select-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#DCE7FE] group-hover:bg-[#C9DCFD] flex items-center justify-center text-[#2B43B5] shrink-0 transition-colors">
              <Clock className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-[15px] font-extrabold text-[#111820] tracking-tight group-hover:text-[#2B43B5] transition-colors">
                Live Event Timer
              </h3>
              <p className="text-[11px] sm:text-[12px] text-[#5A6578] font-normal leading-snug truncate sm:whitespace-normal">
                View the 4-hour countdown. Start, pause and resume (event operator).
              </p>
            </div>
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2B43B5] group-hover:bg-[#1E359E] flex items-center justify-center text-white shrink-0 shadow-xs group-hover:translate-x-0.5 transition-all">
            <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          </div>
        </button>

        {/* Card 2: Team Challenges */}
        <button
          type="button"
          onClick={() => navigate('/teams')}
          id="nav-teams-card-btn"
          aria-label="Navigate to Team Challenges table screen"
          className="group w-full p-3.5 sm:p-4 rounded-2xl bg-[#FEFCE8] hover:bg-[#FEF9C3] border border-[#FEF08A] transition-all duration-200 text-left flex items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99] select-none"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FEF08A] group-hover:bg-[#FDE047] flex items-center justify-center text-[#854D0E] shrink-0 transition-colors">
              <Users className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-[15px] font-extrabold text-[#111820] tracking-tight group-hover:text-[#854D0E] transition-colors">
                Team Challenges
              </h3>
              <p className="text-[11px] sm:text-[12px] text-[#6B6358] font-normal leading-snug truncate sm:whitespace-normal">
                View all teams and their assigned challenges.
              </p>
            </div>
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFE56A] group-hover:bg-[#FDD835] flex items-center justify-center text-[#111820] shrink-0 shadow-xs group-hover:translate-x-0.5 transition-all">
            <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          </div>
        </button>

      </div>
    </div>
  );
}

export default Hero;
