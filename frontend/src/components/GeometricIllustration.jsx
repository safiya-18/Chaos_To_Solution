import React from 'react';

export function GeometricIllustration({ className = '' }) {
  return (
    <div className={`relative w-full max-w-[440px] mx-auto select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 460 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm"
      >
        {/* Dot grid - top left */}
        <g opacity="0.45" fill="#8C8477">
          <circle cx="28" cy="36" r="1.5" />
          <circle cx="44" cy="36" r="1.5" />
          <circle cx="60" cy="36" r="1.5" />
          <circle cx="76" cy="36" r="1.5" />
          <circle cx="92" cy="36" r="1.5" />

          <circle cx="28" cy="52" r="1.5" />
          <circle cx="44" cy="52" r="1.5" />
          <circle cx="60" cy="52" r="1.5" />
          <circle cx="76" cy="52" r="1.5" />
          <circle cx="92" cy="52" r="1.5" />

          <circle cx="28" cy="68" r="1.5" />
          <circle cx="44" cy="68" r="1.5" />
          <circle cx="60" cy="68" r="1.5" />
          <circle cx="76" cy="68" r="1.5" />
          <circle cx="92" cy="68" r="1.5" />

          <circle cx="28" cy="84" r="1.5" />
          <circle cx="44" cy="84" r="1.5" />
          <circle cx="60" cy="84" r="1.5" />
          <circle cx="76" cy="84" r="1.5" />
          <circle cx="92" cy="84" r="1.5" />
        </g>

        {/* Big Yellow Sun/Moon Disc */}
        <circle cx="270" cy="115" r="70" fill="#FFE56A" stroke="#111820" strokeWidth="2.5" />

        {/* Orbit Line looping behind and around */}
        <ellipse
          cx="245"
          cy="150"
          rx="185"
          ry="48"
          stroke="#111820"
          strokeWidth="2"
          strokeDasharray="none"
          transform="rotate(-5 245 150)"
        />

        {/* Left background block - Cream arch structure */}
        <path
          d="M62 250V175C62 161 74 150 88 150H135C149 150 160 161 160 175V250H62Z"
          fill="#E8DFCD"
          stroke="#111820"
          strokeWidth="2.5"
        />
        {/* Arch cut-out in left structure */}
        <path
          d="M86 250V205C86 195 94 187 104 187H118C128 187 136 195 136 205V250H86Z"
          fill="#111820"
        />

        {/* Dark Navy angular block behind arch */}
        <polygon
          points="130,220 180,135 220,145 170,230"
          fill="#2C3A68"
          stroke="#111820"
          strokeWidth="2.5"
        />

        {/* Small purple column / pillar on far left */}
        <rect x="36" y="240" width="18" height="32" rx="2" fill="#7C88C2" stroke="#111820" strokeWidth="2" />
        <line x1="45" y1="240" x2="45" y2="230" stroke="#111820" strokeWidth="1.5" />

        {/* Central Arch Portal */}
        {/* Outer arch rim */}
        <path
          d="M165 240V140C165 110 188 85 218 85C248 85 271 110 271 140V240H165Z"
          fill="#FFFFFF"
          stroke="#111820"
          strokeWidth="3.5"
        />
        {/* Dark Night Interior */}
        <path
          d="M178 240V144C178 122 196 104 218 104C240 104 258 122 258 144V240H178Z"
          fill="#11162B"
        />
        {/* Star in portal center */}
        <path
          d="M218 135 L220.5 147 L232 150 L220.5 153 L218 165 L215.5 153 L204 150 L215.5 147 Z"
          fill="#FFFFFF"
        />
        {/* Tiny star specks in portal */}
        <circle cx="196" cy="125" r="1.2" fill="#FFFFFF" opacity="0.8" />
        <circle cx="238" cy="122" r="1.2" fill="#FFFFFF" opacity="0.8" />
        <circle cx="242" cy="175" r="1" fill="#FFFFFF" opacity="0.6" />
        <circle cx="192" cy="180" r="1" fill="#FFFFFF" opacity="0.6" />

        {/* Right Architectural Towers */}
        {/* Dark navy/slate tower */}
        <rect x="264" y="170" width="22" height="90" fill="#202A44" stroke="#111820" strokeWidth="2.5" />
        {/* Lilac tower */}
        <rect x="284" y="155" width="22" height="105" fill="#D3C3FA" stroke="#111820" strokeWidth="2.5" />
        {/* Soft lavender pale tower */}
        <rect x="304" y="148" width="28" height="112" rx="2" fill="#E6DAFC" stroke="#111820" strokeWidth="2.5" />
        <line x1="318" y1="148" x2="318" y2="260" stroke="#111820" strokeWidth="1.5" opacity="0.6" />

        {/* Stepped 3D Stairs cascading from portal down to the left */}
        {/* Step 1 (top, near portal) */}
        <polygon points="175,225 240,225 248,235 183,235" fill="#FFFFFF" stroke="#111820" strokeWidth="2.5" />
        <polygon points="175,225 183,235 183,243 175,233" fill="#D8D3C8" stroke="#111820" strokeWidth="2.5" />

        {/* Step 2 */}
        <polygon points="163,235 235,235 243,245 171,245" fill="#FAF7F0" stroke="#111820" strokeWidth="2.5" />
        <polygon points="163,235 171,245 171,253 163,243" fill="#D8D3C8" stroke="#111820" strokeWidth="2.5" />

        {/* Step 3 */}
        <polygon points="150,245 230,245 238,255 158,255" fill="#FFFFFF" stroke="#111820" strokeWidth="2.5" />
        <polygon points="150,245 158,255 158,263 150,253" fill="#D8D3C8" stroke="#111820" strokeWidth="2.5" />

        {/* Step 4 */}
        <polygon points="135,255 224,255 232,265 143,265" fill="#FAF7F0" stroke="#111820" strokeWidth="2.5" />
        <polygon points="135,255 143,265 143,273 135,263" fill="#D8D3C8" stroke="#111820" strokeWidth="2.5" />

        {/* Step 5 (bottom foreground) */}
        <polygon points="118,265 218,265 226,275 126,275" fill="#FFFFFF" stroke="#111820" strokeWidth="2.5" />
        <polygon points="118,265 126,275 126,283 118,273" fill="#D8D3C8" stroke="#111820" strokeWidth="2.5" />
        <polygon points="126,275 226,275 226,283 126,283" fill="#EAE5DA" stroke="#111820" strokeWidth="2.5" />

        {/* Floating Star to the right of arch */}
        <path
          d="M338 180 L340 188 L348 190 L340 192 L338 200 L336 192 L328 190 L336 188 Z"
          fill="#111820"
        />

        {/* Floating Star further lower-right */}
        <path
          d="M358 230 L360 236 L366 238 L360 240 L358 246 L356 240 L350 238 L356 236 Z"
          fill="#111820"
        />

        {/* Little dot grid on bottom right */}
        <g opacity="0.35" fill="#8C8477">
          <circle cx="342" cy="265" r="1.3" />
          <circle cx="352" cy="265" r="1.3" />
          <circle cx="362" cy="265" r="1.3" />
          <circle cx="342" cy="275" r="1.3" />
          <circle cx="352" cy="275" r="1.3" />
          <circle cx="362" cy="275" r="1.3" />
        </g>
      </svg>
    </div>
  );
}
