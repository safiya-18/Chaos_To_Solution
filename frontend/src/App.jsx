import React, { useState } from 'react';
import { Hero } from './components/Hero.jsx';
import { ThemeSelector } from './components/ThemeSelector.jsx';
import { GenerateButton } from './components/GenerateButton.jsx';
import { LoadingState } from './components/LoadingState.jsx';
import { ErrorState } from './components/ErrorState.jsx';
import { ChallengeScreen } from './components/ChallengeScreen.jsx';
import { TeamRegistrationInput } from './components/TeamRegistrationInput.jsx';
import { TimerScreen } from './components/TimerScreen.jsx';
import { TeamsScreen } from './components/TeamsScreen.jsx';
import { RouterProvider, useRouter } from './router/Router.jsx';
import { registerTeamAndGenerate } from './services/challengeApi.js';

function AppContent() {
  const { currentPath } = useRouter();
  const [currentScreen, setCurrentScreen] = useState('selection'); // 'selection' | 'challenge'
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamError, setTeamError] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);

  // Default to mock mode if env flag is true or if not explicitly set to false
  const [isMockMode, setIsMockMode] = useState(() => {
    const envVal = import.meta.env.VITE_USE_MOCK;
    if (envVal === 'false' || envVal === false) return false;
    return true; // Default to true so frontend runs independently immediately
  });

  const isTeamNameValid = teamName.trim().length >= 2 && teamName.trim().length <= 50;

  const handleSelectTheme = (themeName) => {
    setSelectedTheme(themeName);
  };

  const handleTeamNameChange = (name) => {
    setTeamName(name);
    if (teamError) setTeamError(null);
  };

  const handleGenerate = async () => {
    if (!selectedTheme || !isTeamNameValid || status === 'loading') {
      if (!isTeamNameValid) {
        setTeamError('Please enter a team name between 2 and 50 characters.');
      }
      return;
    }

    setStatus('loading');
    setError(null);
    setTeamError(null);

    try {
      const result = await registerTeamAndGenerate(teamName, selectedTheme, {
        useMock: isMockMode
      });
      setChallenge(result);
      setStatus('success');
      setCurrentScreen('challenge');
    } catch (err) {
      if (err.code === 'TEAM_ALREADY_EXISTS' || err.status === 409) {
        setTeamError(err.message || `Team name '${teamName.trim()}' is already registered.`);
        setStatus('idle');
      } else {
        setError(err.message || 'Failed to generate challenge. Please try again.');
        setStatus('error');
      }
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

  // ── ROUTE 1: Live Event Timer Screen (/timer) ──
  if (currentPath === '/timer') {
    return <TimerScreen />;
  }

  // ── ROUTE 2: Team Challenge Table Screen (/teams) ──
  if (currentPath === '/teams') {
    return <TeamsScreen />;
  }

  // ── ROUTE 3: Event Dashboard (/) ──
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F7F3EA] text-[#111820] overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-black flex flex-col">
      {/* SCREEN 1: THEME SELECTION & TEAM REGISTRATION */}
      {currentScreen === 'selection' ? (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* LEFT COLUMN: Hero, Team Registration & Navigation Cards on cream bg */}
          <div className="w-full lg:w-[44%] shrink-0 flex flex-col justify-between px-6 py-6 sm:px-8 sm:py-7 lg:px-8 lg:py-6 xl:px-12 xl:py-8 2xl:px-16 2xl:py-10">
            <Hero
              teamName={teamName}
              onTeamNameChange={handleTeamNameChange}
              teamError={teamError}
              isDisabled={status === 'loading'}
            />
          </div>

          {/* RIGHT COLUMN: White elevated challenge theme selection panel */}
          <div className="flex-1 min-w-0 w-full p-4 sm:p-5 lg:p-5 xl:p-6 2xl:p-8 flex flex-col">
            <div className="relative min-h-[480px] flex-1 bg-white rounded-[32px] sm:rounded-[36px] flex flex-col justify-between p-6 sm:p-7 xl:p-8 2xl:p-9 border border-[#11151C]/10 shadow-sm">
              
              {/* Top Bar inside panel: Mode indicator if in mock mode */}
              {isMockMode && (
                <div className="shrink-0 flex items-center justify-end mb-2 select-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Offline Preview Mode
                  </span>
                </div>
              )}

              {/* Theme Selector (Step 1) */}
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
                  isTeamNameValid={isTeamNameValid}
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
        /* SCREEN 2: CHALLENGE REVEAL */
        <div className="min-h-screen min-h-[100dvh] flex flex-col flex-1 px-4 py-4 sm:px-6 sm:py-5 xl:px-10 xl:py-6 2xl:px-14 2xl:py-8">
          <ChallengeScreen
            challengeData={challenge}
            onBackToThemes={handleBackToThemes}
          />
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

export default App;
