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
      setCurrentScreen('challenge');
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
  };

  // Developer console hook to toggle mock mode without occupying participant UI
  React.useEffect(() => {
    window.__toggleMockMode = () => {
      setIsMockMode((prev) => {
        const next = !prev;
        console.log(`[ChaosToSolution] Mock mode toggled: ${next ? 'MOCK DATA' : 'LIVE BACKEND'}`);
        return next;
      });
    };
  }, []);

  return (
    <div className="min-h-screen lg:h-[100dvh] bg-[#F7F3EA] text-[#111820] overflow-x-hidden lg:overflow-hidden font-sans selection:bg-yellow-300 selection:text-black">

      {/* ======================================================== */}
      {/* SCREEN 1: THEME SELECTION — Responsive: stacked on mobile, 2-col on desktop */}
      {/* ======================================================== */}
      {currentScreen === 'selection' ? (
        <div className="flex flex-col lg:flex-row h-auto lg:h-full">
          {/* LEFT COLUMN: Hero on cream bg */}
          <div className="w-full lg:w-[44%] shrink-0 lg:h-full flex flex-col px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-8 xl:px-14 xl:py-10 2xl:px-16 2xl:py-12">
            <Hero />
          </div>

          {/* RIGHT COLUMN: White elevated panel */}
          <div className="flex-1 min-w-0 w-full lg:h-full p-4 sm:p-5 xl:p-6 2xl:p-8">
            <div className="relative min-h-[480px] lg:h-full bg-white rounded-[24px] sm:rounded-[28px] flex flex-col p-5 sm:p-6 xl:p-7 2xl:p-9 border border-[#11151C]/10 shadow-sm overflow-hidden">
              <ThemeSelector
                selectedTheme={selectedTheme}
                onSelectTheme={handleSelectTheme}
                isDisabled={status === 'loading'}
              />

              <div className="mt-3 xl:mt-4 shrink-0">
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
      ) : (
        /* ======================================================== */
        /* SCREEN 2: CHALLENGE REVEAL — Responsive flex-col         */
        /* ======================================================== */
        <div className="min-h-screen lg:h-full flex flex-col px-4 py-4 sm:px-8 sm:py-5 xl:px-12 xl:py-7 2xl:px-14 2xl:py-9">
          <ChallengeScreen
            challengeData={challenge}
            onBackToThemes={handleBackToThemes}
          />
        </div>
      )}
    </div>
  );
}

export default App;
