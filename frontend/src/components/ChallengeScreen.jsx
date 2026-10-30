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
  PersonStanding,
  ShoppingCart,
  Lightbulb,
  Users
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
  Accessibility: PersonStanding,
  PersonStanding,
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

  const allFlipped = Boolean(flippedCards.problem && flippedCards.restriction && flippedCards.resource);

  const handleToggleAll = () => {
    const nextState = !allFlipped;
    setFlippedCards({
      problem: nextState,
      restriction: nextState,
      resource: nextState
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 sm:gap-4 xl:gap-5 animate-fade-in">

      {/* ── HEADER ROW: Back + EventTimer + Theme badge + Source indicator ── */}
      <header className="shrink-0 flex items-center justify-between gap-3 flex-wrap">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToThemes}
          id="back-to-themes-btn"
          className="group min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] text-[#111820] border border-[#11151C]/15 font-bold text-sm shadow-xs transition-all cursor-pointer active:scale-95 touch-manipulation select-none"
          aria-label="Back to Themes selection"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Themes</span>
        </button>

        {/* Right: Theme pill + source */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#11151C]/15 text-sm font-extrabold text-[#111820] shadow-xs select-none"
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

          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border select-none ${
              challengeData.isOfficialCurated || challenge?.isOfficialCurated
                ? 'bg-purple-50 text-purple-900 border-purple-300'
                : source === 'ai'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
            title={
              challengeData.isOfficialCurated || challenge?.isOfficialCurated
                ? 'Official CTS Curated Challenge from Knowledge Base'
                : source === 'ai'
                  ? 'Generated dynamically via AI'
                  : 'Reliable curated fallback challenge'
            }
          >
            {challengeData.isOfficialCurated || challenge?.isOfficialCurated ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />
                <span>Official Curated Challenge</span>
              </>
            ) : source === 'ai' ? (
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

      {/* ── PAGE TITLE, REGISTERED TEAM & REVEAL ALL BUTTON ── */}
      <div className="shrink-0 select-none flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl xl:text-[30px] 2xl:text-[34px] font-black text-[#111820] tracking-tight leading-tight">
              Your Challenge
            </h1>
            {challengeData.teamName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white text-xs font-black tracking-wide shadow-xs">
                <Users className="w-3.5 h-3.5 text-[#FFE56A]" aria-hidden="true" />
                <span>TEAM: {challengeData.teamName}</span>
              </span>
            )}
            {challengeData.isOfflinePreview && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
                Offline Preview Mode
              </span>
            )}
          </div>
          <p className="text-[13px] xl:text-sm text-[#6B6358] font-normal mt-0.5 leading-tight">
            Tap or click any card to reveal your challenge elements.
          </p>
        </div>

        {/* Touch-Friendly "Reveal All Cards" Toggle */}
        <button
          type="button"
          onClick={handleToggleAll}
          id="reveal-all-cards-btn"
          className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] text-[#111820] border border-[#11151C]/15 font-extrabold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 touch-manipulation select-none"
          aria-label={allFlipped ? 'Conceal all challenge cards' : 'Reveal all challenge cards'}
        >
          <Sparkles className="w-4 h-4 text-[#2B43B5]" aria-hidden="true" />
          <span>{allFlipped ? 'Conceal All Cards' : 'Reveal All Cards'}</span>
        </button>
      </div>

      {/* ── THREE FLIP CARDS — responsive: 1 col on mobile, 3 col on md+ ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-5 2xl:gap-6 pb-2">

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
          <div className="flex flex-col h-full space-y-2">
            <div className="flex-1">
              <h4 className="text-[15px] xl:text-[17px] font-black text-[#111820] leading-snug">
                {problem?.title || 'Real-World Challenge Problem'}
              </h4>
              <p className="text-xs xl:text-[13px] text-[#26211C] leading-relaxed whitespace-pre-line font-medium mt-1.5">
                {problem?.statement}
              </p>
            </div>

            {deliverable && (
              <div className="pt-2 border-t border-[#11151C]/15 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111820]/75 block mb-1">
                  Expected Deliverable
                </span>
                <div className="text-[11px] xl:text-xs text-[#26211C] font-semibold leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-modal-scrollbar pr-1">
                  {deliverable}
                </div>
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
          <div className="flex flex-col h-full space-y-2">
            <div className="flex-1">
              <h4 className="text-[15px] xl:text-[17px] font-black text-[#111820] leading-snug">
                {restriction?.name || 'Technical Constraint'}
              </h4>
              <div className="mt-2 p-3 xl:p-3.5 rounded-2xl bg-[#FFF8D4] border border-[#F6DF84] text-xs xl:text-[13px] text-[#3D2C00] leading-relaxed font-medium">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#854D0E] mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#854D0E]" />
                  CONSTRAINT RULE
                </div>
                {restriction?.rule}
              </div>
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
          <div className="flex flex-col h-full space-y-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[15px] xl:text-[17px] font-black text-[#111820] leading-snug">
                  {resource?.name || 'Assigned Resource'}
                </h4>
                {resource?.type && (
                  <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/80 border border-[#11151C]/15 text-[#0369A1]">
                    {resource.type}
                  </span>
                )}
              </div>
              <p className="text-xs xl:text-[13px] text-[#132C4F] leading-relaxed font-medium mt-1.5">
                {resource?.guidance}
              </p>
            </div>

            {resource?.docsUrl && (
              <div className="pt-2 shrink-0">
                <a
                  href={resource.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#11151C] hover:bg-[#202733] text-white text-xs font-bold transition-all cursor-pointer active:scale-95 touch-manipulation shadow-xs"
                >
                  <span>Open Documentation</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        </ChallengeFlipCard>
      </div>

      {/* ── WHATSAPP SHARE ── */}
      <div className="shrink-0">
        <WhatsAppShareForm challengeData={challengeData} />
      </div>
    </div>
  );
}

export default ChallengeScreen;
