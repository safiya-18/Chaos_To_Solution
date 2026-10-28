import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, CheckCircle, Pause } from 'lucide-react';
import { fetchEventTimerState } from '../services/challengeApi.js';

/**
 * Formats milliseconds into HH:MM:SS format.
 */
export function formatMilliseconds(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) {
    return '04:00:00';
  }

  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function EventTimer({ className = '' }) {
  const [timerData, setTimerData] = useState(null);
  const [localRemainingMs, setLocalRemainingMs] = useState(14400000); // 4 hours default
  const [status, setStatus] = useState('loading'); // 'loading' | 'not_started' | 'running' | 'paused' | 'completed' | 'unavailable'
  const lastSyncRef = useRef(null);

  // 1. Authoritative Server Sync via Light Polling (every 12 seconds)
  useEffect(() => {
    let isMounted = true;

    const syncServerTimer = async () => {
      try {
        const data = await fetchEventTimerState();
        if (!isMounted) return;

        if (!data) {
          if (!timerData) setStatus('unavailable');
          return;
        }

        setTimerData(data);
        setStatus(data.status);
        lastSyncRef.current = Date.now();

        if (data.status === 'running') {
          // Compute remaining relative to server endsAt
          const serverEndsAt = new Date(data.endsAt).getTime();
          const remaining = Math.max(0, serverEndsAt - Date.now());
          setLocalRemainingMs(remaining);
        } else {
          setLocalRemainingMs(data.remainingMs ?? 14400000);
        }
      } catch {
        if (isMounted && !timerData) setStatus('unavailable');
      }
    };

    syncServerTimer();
    const pollInterval = setInterval(syncServerTimer, 12000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // 2. Smooth 1-second local countdown when running
  useEffect(() => {
    if (status !== 'running') return;

    const tick = setInterval(() => {
      setLocalRemainingMs((prev) => {
        if (prev <= 1000) {
          setStatus('completed');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [status]);

  // Warning thresholds
  const isCritical = status === 'running' && localRemainingMs <= 10 * 60 * 1000; // < 10 mins
  const isWarning = status === 'running' && !isCritical && localRemainingMs <= 60 * 60 * 1000; // < 60 mins

  const formattedTime = formatMilliseconds(localRemainingMs);

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Hackathon event timer: ${formattedTime} remaining, status: ${status}`}
      className={`relative inline-flex items-center gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl border transition-all duration-300 select-none shadow-xs ${
        isCritical
          ? 'bg-red-500/10 border-red-500/40 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-800'
          : status === 'paused'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700'
          : status === 'completed'
          ? 'bg-stone-200 border-stone-300 text-stone-600'
          : status === 'unavailable'
          ? 'bg-stone-100 border-stone-300 text-stone-500'
          : 'bg-[#111820]/5 border-[#111820]/15 text-[#111820]'
      } ${className}`}
    >
      {/* Icon */}
      <div className="shrink-0 flex items-center justify-center">
        {status === 'paused' ? (
          <Pause className="w-4 h-4 text-amber-600" aria-hidden="true" />
        ) : status === 'completed' ? (
          <CheckCircle className="w-4 h-4 text-stone-500" aria-hidden="true" />
        ) : isCritical || isWarning ? (
          <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
        ) : (
          <Clock className="w-4 h-4 text-[#304DB4]" aria-hidden="true" />
        )}
      </div>

      {/* Timer Text & Status */}
      <div className="flex flex-col">
        <span className="text-[9.5px] font-black uppercase tracking-[0.16em] opacity-75 leading-none">
          {status === 'not_started'
            ? 'EVENT TIME (4H)'
            : status === 'paused'
            ? 'COUNTDOWN PAUSED'
            : status === 'completed'
            ? 'HACKATHON ENDED'
            : status === 'unavailable'
            ? 'TIMER CONNECTING'
            : isCritical
            ? 'FINAL SPRINT'
            : isWarning
            ? 'FINAL HOUR'
            : 'TIME REMAINING'}
        </span>

        <span className="text-sm sm:text-base font-black font-mono tracking-wider leading-tight mt-0.5">
          {status === 'unavailable' ? '--:--:--' : formattedTime}
        </span>
      </div>

      {/* Pulse Status Dot */}
      <div className="shrink-0 ml-1">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            status === 'running'
              ? isCritical
                ? 'bg-red-500 animate-ping'
                : 'bg-emerald-500 animate-pulse'
              : status === 'paused'
              ? 'bg-amber-500'
              : status === 'completed'
              ? 'bg-stone-400'
              : 'bg-blue-400'
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default EventTimer;
