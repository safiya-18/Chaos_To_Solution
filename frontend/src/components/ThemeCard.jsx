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
  Lightbulb
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
      className={`w-full h-full text-left px-4 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 group flex items-center justify-between gap-3 border-2 touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111820] ${
        isSelected
          ? 'border-[#111820] shadow-sm'
          : 'border-transparent hover:border-[#111820]/20'
      } ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'
      }`}
    >
      {/* Left: Icon circle */}
      <div
        style={{ backgroundColor: theme.iconBg || '#E7E5E4' }}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#111820] shrink-0"
      >
        <IconComponent className="w-5 h-5 stroke-[2]" aria-hidden="true" />
      </div>

      {/* Center: Title + short description */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13.5px] sm:text-[14.5px] font-black text-[#111820] tracking-tight leading-snug truncate">
          {theme.name}
        </h3>
        <p className="text-[11px] sm:text-[11.5px] text-[#524B43] leading-tight mt-0.5 font-medium truncate">
          {theme.shortDesc}
        </p>
      </div>

      {/* Right: Arrow circle */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isSelected
            ? 'bg-[#111820] text-white'
            : 'border border-[#111820]/20 text-[#111820] bg-transparent group-hover:border-[#111820]/50'
        }`}
        aria-hidden="true"
      >
        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
      </div>
    </button>
  );
}

export default ThemeCard;
