import React from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';

export function ResourceLink({ docsUrl, name }) {
  if (!docsUrl) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#11151C]/15 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-[#524B43] font-medium">
        <BookOpen className="w-3.5 h-3.5 text-[#304DB4]" aria-hidden="true" />
        <span>Documentation:</span>
      </div>

      <a
        href={docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#11151C] hover:bg-[#202735] text-white text-xs font-bold transition-all group shadow-xs"
        aria-label={`Open ${name} documentation in a new tab`}
      >
        <span>Explore Docs</span>
        <ExternalLink
          className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#FFE56A]"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
