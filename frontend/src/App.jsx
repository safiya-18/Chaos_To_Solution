import React, { useState } from 'react';
import { Hero } from './components/Hero.jsx';
import { ThemeSelector } from './components/ThemeSelector.jsx';
import { GenerateButton } from './components/GenerateButton.jsx';
import { LoadingState } from './components/LoadingState.jsx';
import { ErrorState } from './components/ErrorState.jsx';
import { ChallengeScreen } from './components/ChallengeScreen.jsx';
import { generateChallenge } from './services/challengeApi.js';

export function App() {
  const [currentScreen, setCurrentScreen] = useState('selection'); // 'selection' | 'challenge'
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);

  // Default to mock mode if env flag is true or if not explicitly set to false
  const [isMockMode, setIsMockMode] = useState(() => {
    const envVal = import.meta.env.VITE_USE_MOCK;
    if (envVal === 'false' || envVal === false) return false;
    return true; // Default to true so frontend runs independently immediately
  });

  const handleSelectTheme = (themeName) => {
    setSelectedTheme(themeName);
  };

  const handleGenerate = async () => {
    if (!selectedTheme || status === 'loading') return;

    setStatus('loading');
    setError(null);

    try {
      const result = await generateChallenge(selectedTheme, {
        useMock: isMockMode
      });
      setChallenge(result);
      setStatus('success');
      // Navigate to Screen 2
      setCurrentScreen('challenge');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to generate challenge. Please try again.');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    handleGenerate();
  };

  const handleBackToThemes = () => {
    setCurrentScreen('selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleMock = () => {
    setIsMockMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#111820] flex flex-col justify-between selection:bg-yellow-300 selection:text-black font-sans">
      {/* Main Viewport Container */}
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* SCREEN 1: THEME SELECTION & BRAND HERO */}
        {/* ======================================================== */}
        {currentScreen === 'selection' ? (
          <main className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              {/* Left Column: Brand Hero, Condensed Headline, Illustration, Features */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <Hero />
              </div>

              {/* Right Column: Elevated Theme Selection Panel & Generate Button */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border border-[#11151C]/12 shadow-sm h-full flex flex-col justify-between">
                  <div>
                    <ThemeSelector
                      selectedTheme={selectedTheme}
                      onSelectTheme={handleSelectTheme}
                      isDisabled={status === 'loading'}
                    />

                    <GenerateButton
                      onClick={handleGenerate}
                      isLoading={status === 'loading'}
                      selectedTheme={selectedTheme}
                      hasExistingChallenge={Boolean(challenge)}
                    />
                  </div>

                  {status === 'loading' && <LoadingState theme={selectedTheme} />}

                  {status === 'error' && (
                    <ErrorState
                      error={error}
                      onRetry={handleRetry}
                      isRetrying={status === 'loading'}
                    />
                  )}
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* ======================================================== */
          /* SCREEN 2: GENERATED CHALLENGE REVEAL EXPERIENCE */
          /* ======================================================== */
          <main className="w-full">
            <ChallengeScreen
              challengeData={challenge}
              onBackToThemes={handleBackToThemes}
            />
          </main>
        )}
      </div>

      {/* Subtle Shared Footer */}
      <footer className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6358] font-semibold gap-2 select-none border-t border-[#11151C]/8">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#111820]">CHAOS TO SOLUTION.</span>
          <span className="opacity-40">•</span>
          <span className="opacity-80">AI-POWERED BUILD CHALLENGE</span>
        </div>

        <button
          type="button"
          onClick={handleToggleMock}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all border cursor-pointer ${
            isMockMode
              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
          }`}
          title="Toggle between Live Backend API and Standalone Mock Mode"
          aria-label={`Toggle mock mode: currently ${isMockMode ? 'Mock Data' : 'Live Backend'}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMockMode ? 'bg-amber-600' : 'bg-emerald-600 animate-pulse'
            }`}
            aria-hidden="true"
          />
          <span>{isMockMode ? 'MOCK MODE' : 'LIVE API'}</span>
        </button>
      </footer>
    </div>
  );
}

export default App;
