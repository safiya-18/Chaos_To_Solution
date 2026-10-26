import React from 'react';
import {
  GraduationCap,
  Database,
  HeartPulse,
  Leaf,
  Building2,
  Accessibility,
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
  Accessibility,
  ShoppingCart,
  Lightbulb,
};

export function ThemeCard({ theme, isSelected, isDisabled, onSelect }) {
  const IconComponent = ICON_MAP[theme.iconName] || Lightbulb;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={isDisabled}
      onClick={() => onSelect(theme.name)}
      style={{ backgroundColor: theme.bgColor || '#F5F5F4' }}
      className={`relative w-full text-left p-2.5 sm:p-3 rounded-2xl transition-all duration-200 group flex items-center justify-between gap-2.5 sm:gap-3 border ${
        isSelected
          ? 'border-[#111820] ring-2 ring-[#111820] shadow-md scale-[1.01]'
          : 'border-transparent hover:border-[#111820]/20 hover:shadow-sm'
      } ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'
      }`}
    >
      {/* Left: Circular icon badge */}
      <div
        style={{ backgroundColor: theme.iconBg || '#E7E5E4' }}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#111820] shrink-0 border border-[#111820]/10 shadow-xs"
      >
        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" aria-hidden="true" />
      </div>

      {/* Center: Title & concise description */}
      <div className="flex-1 min-w-0 pr-1">
        <h3 className="text-xs sm:text-[14px] font-black text-[#111820] tracking-tight leading-snug">
          {theme.name}
        </h3>
        <p className="text-[10.5px] sm:text-[11.5px] text-[#524B43] leading-[1.25] mt-0.5 font-normal">
          {theme.shortDesc}
        </p>
      </div>

      {/* Right: Circular arrow */}
      <div
        className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'bg-[#111820] text-white border border-[#111820]'
            : 'border border-[#111820]/35 text-[#111820] group-hover:border-[#111820] group-hover:bg-[#111820]/5'
        }`}
        aria-hidden="true"
      >
        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4]" />
      </div>
    </button>
  );
}
