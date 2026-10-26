import React from 'react';
import {
  GraduationCap,
  Database,
  HeartPulse,
  Leaf,
  Building2,
  PersonStanding,
  ShoppingCart,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

const ICON_MAP = {
  GraduationCap,
  Database,
  HeartPulse,
  Leaf,
  Building2,
  Accessibility: PersonStanding,
  PersonStanding,
  ShoppingCart,
  Lightbulb,
};

export function ThemeCard({ theme, isSelected, isDisabled, onSelect }) {
  const IconComponent = ICON_MAP[theme.iconName] || ICON_MAP[theme.name] || Lightbulb;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${theme.name}: ${theme.shortDesc}`}
      disabled={isDisabled}
      onClick={() => onSelect(theme.name)}
      style={{ backgroundColor: theme.bgColor || '#F5F5F4' }}
      className={`h-full w-full min-h-[52px] sm:min-h-0 text-left p-3 xl:p-3.5 rounded-2xl transition-all duration-150 group flex items-center gap-2.5 xl:gap-3 border touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111820] ${
        isSelected
          ? 'border-[#111820] ring-2 ring-[#111820] shadow-md'
          : 'border-transparent hover:border-[#111820]/20 hover:shadow-xs'
      } ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* Left: Icon circle — sized relative to card height */}
      <div
        style={{ backgroundColor: theme.iconBg || '#E7E5E4' }}
        className="w-9 h-9 xl:w-10 xl:h-10 2xl:w-11 2xl:h-11 rounded-full flex items-center justify-center text-[#111820] shrink-0 border border-[#111820]/10"
      >
        <IconComponent className="w-4.5 h-4.5 xl:w-5 xl:h-5 stroke-[1.9]" aria-hidden="true" />
      </div>

      {/* Center: Title + short description */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] xl:text-[14px] 2xl:text-[15px] font-black text-[#111820] tracking-tight leading-snug">
          {theme.name}
        </h3>
        <p className="text-[11px] xl:text-[11.5px] text-[#524B43] leading-snug mt-0.5 font-medium line-clamp-2">
          {theme.shortDesc}
        </p>
      </div>

      {/* Right: Arrow circle */}
      <div
        className={`w-6 h-6 xl:w-7 xl:h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
          isSelected
            ? 'bg-[#111820] text-white border-[#111820]'
            : 'border-[#111820]/30 text-[#111820] group-hover:border-[#111820] group-hover:bg-[#111820]/5'
        }`}
        aria-hidden="true"
      >
        <ArrowRight className="w-3 h-3 xl:w-3.5 xl:h-3.5 stroke-[2.5]" />
      </div>
    </button>
  );
}

export default ThemeCard;
