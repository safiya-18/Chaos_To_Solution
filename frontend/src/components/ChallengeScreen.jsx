import React, { useState } from 'react';
import {
  ChevronLeft,
  FileText,
  Settings,
  Box,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Database,
  HeartPulse,
  Leaf,
  Building2,
  Accessibility,
  ShoppingCart,
  Lightbulb
} from 'lucide-react';
import { THEMES } from '../data/mockChallenges.js';
import { ChallengeFlipCard } from './ChallengeFlipCard.jsx';
import { WhatsAppShareForm } from './WhatsAppShareForm.jsx';

const THEME_ICON_MAP = {
  GraduationCap,
  Database,
  HeartPulse,
  Leaf,
  Building2,
  Accessibility,
  ShoppingCart,
  Lightbulb
};

export function ChallengeScreen({ challengeData, onBackToThemes }) {
  const [flippedCards, setFlippedCards] = useState({
    problem: false,
    restriction: false,
    resource: false
  });

  if (!challengeData) return null;

  const { theme, source, challenge } = challengeData;
  const { problem, restriction, resource, deliverable } = challenge || {};

  // Find theme configuration
  const themeConfig = THEMES.find((t) => t.name.toLowerCase() === (theme || '').toLowerCase()) || THEMES[0];
  const ThemeIcon = THEME_ICON_MAP[themeConfig?.iconName] || Lightbulb;

  const toggleCard = (cardKey) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto py-2 sm:py-4 animate-fade-in flex flex-col justify-between">
      {/* ======================================================== */}
      {/* TOP HEADER ROW: Back Button + Theme Pill + Source Badge */}
      {/* ======================================================== */}
      <header className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        {/* Left: Back to Themes Button */}
        <button
          type="button"
          onClick={onBackToThemes}
          id="back-to-themes-btn"
          className="group flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white hover:bg-[#F2ECE1] text-[#111820] border border-[#11151C]/15 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
          aria-label="Back to Themes selection"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Themes</span>
        </button>

        {/* Right: Theme Pill & Source Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Pill Badge */}
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#11151C]/15 text-xs sm:text-sm font-extrabold text-[#111820] shadow-xs select-none"
            style={{ backgroundColor: themeConfig?.bgColor || '#F3E8FF' }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: themeConfig?.iconBg || '#E9D5FF' }}
            >
              <ThemeIcon className="w-3 h-3 text-[#111820] stroke-[2.4]" aria-hidden="true" />
            </div>
            <span>{theme} Challenge</span>
          </div>

          {/* Discreet Source Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border select-none ${
              source === 'ai'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
            title={source === 'ai' ? 'Generated dynamically via Gemini AI' : 'Reliable curated fallback challenge'}
          >
            {source === 'ai' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>AI Generated</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                <span>Backup Challenge</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* PAGE HEADING */}
      {/* ======================================================== */}
      <div className="mb-6 sm:mb-8 select-none">
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#111820] tracking-tight leading-tight">
          Your Challenge
        </h1>
        <p className="text-sm sm:text-base text-[#6B6358] font-normal mt-1 leading-normal">
          Click on each card to reveal your challenge elements.
        </p>
      </div>

      {/* ======================================================== */}
      {/* THREE INTERACTIVE FLIP CARDS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
        {/* CARD 01: PROBLEM STATEMENT */}
        <ChallengeFlipCard
          step="01"
          title="Problem Statement"
          subtitle="A real-world problem for you to solve."
          colorScheme="lavender"
          icon={FileText}
          isFlipped={flippedCards.problem}
          onToggleFlip={() => toggleCard('problem')}
        >
          <div className="space-y-3">
            <h4 className="text-base sm:text-lg font-black text-[#111820] leading-snug">
              {problem?.title || 'Real-World Challenge Problem'}
            </h4>
            <p className="text-xs sm:text-sm text-[#26211C] leading-relaxed whitespace-pre-line font-normal">
              {problem?.statement}
            </p>

            {deliverable && (
              <div className="mt-4 pt-3 border-t border-[#11151C]/15">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#111820]/75 block mb-1">
                  Expected Deliverable
                </span>
                <p className="text-xs text-[#26211C] font-semibold leading-snug">
                  {deliverable}
                </p>
              </div>
            )}
          </div>
        </ChallengeFlipCard>

        {/* CARD 02: RESTRICTIONS */}
        <ChallengeFlipCard
          step="02"
          title="Restrictions"
          subtitle="Rules and constraints you must follow."
          colorScheme="yellow"
          icon={Settings}
          isFlipped={flippedCards.restriction}
          onToggleFlip={() => toggleCard('restriction')}
        >
          <div className="space-y-3">
            <h4 className="text-base sm:text-lg font-black text-[#111820] leading-snug">
              {restriction?.name || 'Technical Constraint'}
            </h4>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF8D4] border border-[#F6DF84] text-xs sm:text-[13px] text-[#3D2C00] leading-relaxed font-medium shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#854D0E] mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#854D0E]" />
                CONSTRAINT RULE
              </div>
              {restriction?.rule}
            </div>
          </div>
        </ChallengeFlipCard>

        {/* CARD 03: RESOURCES */}
        <ChallengeFlipCard
          step="03"
          title="Resources"
          subtitle="Tools, datasets or APIs you will use."
          colorScheme="blue"
          icon={Box}
          isFlipped={flippedCards.resource}
          onToggleFlip={() => toggleCard('resource')}
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-base sm:text-lg font-black text-[#111820] leading-snug">
                {resource?.name || 'Assigned Resource'}
              </h4>
              {resource?.type && (
                <span className="inline-block mt-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/80 border border-[#11151C]/15 text-[#0369A1]">
                  {resource.type}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-[13px] text-[#132C4F] leading-relaxed font-normal">
              {resource?.guidance}
            </p>

            {resource?.docsUrl && (
              <div className="pt-2">
                <a
                  href={resource.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#11151C] hover:bg-[#202733] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Open Documentation</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        </ChallengeFlipCard>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM SECTION: SHARE YOUR MISSION VIA WHATSAPP */}
      {/* ======================================================== */}
      <div className="mt-8">
        <WhatsAppShareForm challengeData={challengeData} />
      </div>
    </div>
  );
}

export default ChallengeScreen;
