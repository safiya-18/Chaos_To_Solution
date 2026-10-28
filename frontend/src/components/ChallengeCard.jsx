import React from 'react';

const CARD_STYLES = {
  '01': {
    cardBg: 'bg-white',
    badgeBg: 'bg-[#CDE7FB]',
    badgeText: 'text-[#111820]',
    accentBorder: 'border-l-4 border-l-[#304DB4]'
  },
  '02': {
    cardBg: 'bg-white',
    badgeBg: 'bg-[#FEF3C7]',
    badgeText: 'text-[#111820]',
    accentBorder: 'border-l-4 border-l-[#F59E0B]'
  },
  '03': {
    cardBg: 'bg-white',
    badgeBg: 'bg-[#DCFCE7]',
    badgeText: 'text-[#111820]',
    accentBorder: 'border-l-4 border-l-[#22C55E]'
  },
  '04': {
    cardBg: 'bg-white',
    badgeBg: 'bg-[#F3E8FF]',
    badgeText: 'text-[#111820]',
    accentBorder: 'border-l-4 border-l-[#A855F7]'
  }
};

export function ChallengeCard({
  number,
  label,
  title,
  subtitle,
  children
}) {
  const style = CARD_STYLES[number] || CARD_STYLES['01'];

  return (
    <article
      className={`relative p-5 sm:p-6 rounded-2xl ${style.cardBg} border-2 border-[#11151C] ${style.accentBorder} shadow-sm flex flex-col justify-between transition-all`}
    >
      <div>
        {/* Header: Number Badge and Section Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border border-[#11151C] ${style.badgeBg} ${style.badgeText} shadow-xs`}
            >
              {number}
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#111820]">
              {label}
            </span>
          </div>

          {subtitle && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F7F3EA] text-[#4A453E] border border-[#11151C]/20 font-semibold">
              {subtitle}
            </span>
          )}
        </div>

        {/* Title */}
        {title && (
          <h3 className="text-base sm:text-lg font-extrabold text-[#111820] tracking-tight leading-snug mb-2">
            {title}
          </h3>
        )}

        {/* Content Body */}
        <div className="text-xs sm:text-sm text-[#4A453E] leading-relaxed">
          {children}
        </div>
      </div>
    </article>
  );
}
