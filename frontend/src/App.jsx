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
    <div className="min-h-[100dvh] bg-[#F7F3EA] text-[#111820] flex flex-col justify-center selection:bg-yellow-300 selection:text-black font-sans">
      {/* Main Viewport Container */}
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 md:py-4 flex-1 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* SCREEN 1: THEME SELECTION & BRAND HERO */}
        {/* ======================================================== */}
        {currentScreen === 'selection' ? (
          <main className="w-full my-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-stretch">
              {/* Left Column: Brand Hero, Condensed Headline, Illustration, Features */}
              <div className="md:col-span-5 flex flex-col justify-between py-1">
                <Hero />
              </div>

              {/* Right Column: Elevated Theme Selection Panel & Generate Button */}
              <div className="md:col-span-7 flex flex-col justify-center">
                <div className="bg-white rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-4.5 lg:p-5 border border-[#11151C]/12 shadow-sm flex flex-col justify-between">
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
          <main className="w-full my-auto">
            <ChallengeScreen
              challengeData={challenge}
              onBackToThemes={handleBackToThemes}
            />
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
