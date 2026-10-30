import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useRouter } from '../router/Router.jsx';
import {
  fetchEventTimerState,
  startEventTimer,
  pauseEventTimer,
  resumeEventTimer,
  resetEventTimer
} from '../services/challengeApi.js';
import { formatMilliseconds } from './EventTimer.jsx';

export function TimerScreen() {
  const { navigate } = useRouter();

  const [timerData, setTimerData] = useState(null);
  const [localRemainingMs, setLocalRemainingMs] = useState(14400000); // 4 hours
  const [status, setStatus] = useState('loading'); // 'loading' | 'not_started' | 'running' | 'paused' | 'completed' | 'unavailable'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Operator Authorization State (kept strictly in volatile memory, never in browser storage)
  const [operatorToken, setOperatorToken] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Authoritative Backend Poll (every 8 seconds)
  useEffect(() => {
    let isMounted = true;

    const syncTimer = async () => {
      try {
        const data = await fetchEventTimerState();
        if (!isMounted) return;

        if (!data) {
          if (!timerData) setStatus('unavailable');
          return;
        }

        setTimerData(data);
        setStatus(data.status);

        if (data.status === 'running' && data.endsAt) {
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

    syncTimer();
    const interval = setInterval(syncTimer, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Smooth 1-second local tick
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

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored if blocked by browser policy
    }
  };

  // Operator Action Dispatcher
  const handleOperatorAction = async (action) => {
    setActionError(null);

    // If operator has no token, prompt dialog
    if (!operatorToken) {
      setPendingAction(action);
      setTokenInput('');
      setShowAuthModal(true);
      return;
    }

    setActionLoading(true);
    try {
      let updated;
      if (action === 'start') updated = await startEventTimer(operatorToken);
      if (action === 'pause') updated = await pauseEventTimer(operatorToken);
      if (action === 'resume') updated = await resumeEventTimer(operatorToken);
      if (action === 'reset') updated = await resetEventTimer(operatorToken);

      if (updated) {
        setTimerData(updated);
        setStatus(updated.status);
        if (updated.status === 'running' && updated.endsAt) {
          setLocalRemainingMs(Math.max(0, new Date(updated.endsAt).getTime() - Date.now()));
        } else {
          setLocalRemainingMs(updated.remainingMs);
        }
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setOperatorToken('');
        setPendingAction(action);
        setShowAuthModal(true);
        setActionError('Invalid admin token. Please re-enter your operator credentials.');
      } else {
        setActionError(err.message || `Failed to execute ${action}.`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAuth = async (e) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;

    setOperatorToken(token);
    setShowAuthModal(false);

    if (pendingAction) {
      const act = pendingAction;
      setPendingAction(null);
      setActionLoading(true);
      try {
        let updated;
        if (act === 'start') updated = await startEventTimer(token);
        if (act === 'pause') updated = await pauseEventTimer(token);
        if (act === 'resume') updated = await resumeEventTimer(token);
        if (act === 'reset') updated = await resetEventTimer(token);

        if (updated) {
          setTimerData(updated);
          setStatus(updated.status);
          setLocalRemainingMs(updated.remainingMs);
        }
      } catch (err) {
        setActionError(err.message || 'Action failed.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const formattedTime = formatMilliseconds(localRemainingMs);
  const isCritical = status === 'running' && localRemainingMs <= 10 * 60 * 1000;
  const isWarning = status === 'running' && !isCritical && localRemainingMs <= 60 * 60 * 1000;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#11151C] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none overflow-x-hidden overflow-y-auto font-sans">

      {/* ── TOP NAV BAR ── */}
      <header className="shrink-0 flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span>Dashboard</span>
        </button>

        {/* Small Event Title */}
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.24em] text-[#FFE56A] block">
            IEEE COMPUTER SOCIETY
          </span>
          <h1 className="text-xs sm:text-sm font-black text-white/90 tracking-wide mt-0.5">
            CHAOS TO SOLUTION — LIVE EVENT TIMER
          </h1>
        </div>

        {/* Fullscreen & Token Indicators */}
        <div className="flex items-center gap-2">
          {operatorToken && (
            <span
              title="Operator authorized"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Operator Ready</span>
            </span>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 transition-all cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* ── CENTER DISPLAY: Giant High-Contrast Digits ── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-auto">

        {/* Status Pill Badge */}
        <div className="mb-4 sm:mb-6">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-black tracking-[0.18em] uppercase border shadow-md transition-all ${
              status === 'not_started'
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                : status === 'paused'
                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300 animate-pulse'
                : status === 'completed'
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : isCritical
                ? 'bg-red-600/30 border-red-500 text-red-400 animate-pulse'
                : isWarning
                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'running'
                  ? 'bg-emerald-400 animate-ping'
                  : status === 'paused'
                  ? 'bg-yellow-400'
                  : status === 'completed'
                  ? 'bg-red-400'
                  : 'bg-amber-400'
              }`}
              aria-hidden="true"
            />
            <span>
              {status === 'not_started'
                ? 'NOT STARTED'
                : status === 'paused'
                ? 'COUNTDOWN PAUSED'
                : status === 'completed'
                ? 'HACKATHON ENDED'
                : status === 'unavailable'
                ? 'CONNECTING TO BACKEND...'
                : isCritical
                ? 'FINAL SPRINT (<10M)'
                : isWarning
                ? 'FINAL HOUR'
                : 'EVENT RUNNING'}
            </span>
          </span>
        </div>

        {/* Authoritative Giant Digits */}
        <div
          role="timer"
          aria-live="polite"
          aria-label={`Event countdown: ${formattedTime}`}
          className={`font-mono font-black tracking-tight select-none transition-colors duration-300 ${
            status === 'completed'
              ? 'text-red-500'
              : isCritical
              ? 'text-red-400 drop-shadow-[0_0_35px_rgba(239,68,68,0.5)]'
              : isWarning
              ? 'text-amber-300 drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]'
              : status === 'paused'
              ? 'text-yellow-200'
              : 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]'
          }`}
          style={{
            fontSize: 'clamp(68px, 17vw, 210px)',
            lineHeight: '0.9',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {status === 'unavailable' ? '--:--:--' : formattedTime}
        </div>

        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/50 uppercase tracking-[0.2em] font-bold">
          {status === 'completed'
            ? 'Sprint concluded. Please submit prototypes to judges.'
            : 'Authoritative Event Countdown (4 Hours = 14,400 Seconds)'}
        </p>

        {actionError && (
          <div className="mt-4 max-w-md mx-auto p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
            {actionError}
          </div>
        )}
      </main>

      {/* ── BOTTOM OPERATOR CONTROL BAR ── */}
      <footer className="shrink-0 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center p-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
          {/* Start Button */}
          {status === 'not_started' && (
            <button
              type="button"
              onClick={() => handleOperatorAction('start')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFE56A] hover:bg-[#FDD835] text-[#111820] font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Start Event (4H)</span>
            </button>
          )}

          {/* Pause Button */}
          {status === 'running' && (
            <button
              type="button"
              onClick={() => handleOperatorAction('pause')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-[#111820] font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Pause Timer</span>
            </button>
          )}

          {/* Resume Button */}
          {status === 'paused' && (
            <button
              type="button"
              onClick={() => handleOperatorAction('resume')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-[#111820] font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Resume Timer</span>
            </button>
          )}

          {/* Reset Button (Operator Only) */}
          <button
            type="button"
            onClick={() => handleOperatorAction('reset')}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset (Operator)</span>
          </button>

          {/* Operator Token Settings Button */}
          <button
            type="button"
            onClick={() => {
              setTokenInput(operatorToken);
              setShowAuthModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 text-xs font-semibold transition-all cursor-pointer"
            title="Set Operator Token"
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Admin Token</span>
          </button>
        </div>

        <p className="text-[11px] text-white/40 font-medium">
          Authoritative MongoDB Timer • Start, pause and reset mutations require operator credentials.
        </p>
      </footer>

      {/* ── OPERATOR AUTHORIZATION MODAL ── */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#1C222E] border border-white/20 p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE56A] text-[#111820] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div>
                <h3 id="auth-modal-title" className="text-base font-extrabold text-white">
                  Event Operator Token
                </h3>
                <p className="text-xs text-white/60">Required to mutate the shared event timer.</p>
              </div>
            </div>

            <form onSubmit={handleConfirmAuth} className="mt-4">
              <label htmlFor="operator-token-field" className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Admin Token
              </label>
              <input
                id="operator-token-field"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter EVENT_ADMIN_TOKEN..."
                autoFocus
                className="w-full h-11 px-3.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE56A]"
              />

              {actionError && (
                <p className="mt-2 text-xs text-red-400 font-medium">{actionError}</p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setPendingAction(null);
                  }}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!tokenInput.trim()}
                  className="px-5 py-2 rounded-full bg-[#FFE56A] hover:bg-[#FDD835] text-[#111820] text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  Save & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TimerScreen;
