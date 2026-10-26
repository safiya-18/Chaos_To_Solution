import React from 'react';
import { Clock, Users, Trophy } from 'lucide-react';

export function FeatureIndicators() {
  return (
    <div className="grid grid-cols-3 gap-3 xl:gap-4">
      {/* 4 Hours / Build Time */}
      <div className="flex items-center gap-2.5 xl:gap-3 min-w-0">
        <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#E5D4FA] border border-[#D3C0EE] flex items-center justify-center text-[#111820] shrink-0">
          <Clock className="w-4 h-4 xl:w-4.5 xl:h-4.5 stroke-[2.2]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] xl:text-[14px] font-black text-[#111820] leading-none truncate">
            4 Hours
          </div>
          <div className="text-[11px] text-[#78716C] font-semibold mt-1 leading-none truncate">
            Build Time
          </div>
        </div>
      </div>

      {/* 2 Members / Per Team */}
      <div className="flex items-center gap-2.5 xl:gap-3 min-w-0">
        <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#111820] shrink-0">
          <Users className="w-4 h-4 xl:w-4.5 xl:h-4.5 stroke-[2.2]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] xl:text-[14px] font-black text-[#111820] leading-none truncate">
            2 Members
          </div>
          <div className="text-[11px] text-[#78716C] font-semibold mt-1 leading-none truncate">
            Per Team
          </div>
        </div>
      </div>

      {/* Real Problems / Real Impact */}
      <div className="flex items-center gap-2.5 xl:gap-3 min-w-0">
        <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#CDE7FB] border border-[#BAE6FD] flex items-center justify-center text-[#111820] shrink-0">
          <Trophy className="w-4 h-4 xl:w-4.5 xl:h-4.5 stroke-[2.2]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] xl:text-[14px] font-black text-[#111820] leading-none truncate">
            Real Problems
          </div>
          <div className="text-[11px] text-[#78716C] font-semibold mt-1 leading-none truncate">
            Real Impact
          </div>
        </div>
      </div>
    </div>
  );
}
