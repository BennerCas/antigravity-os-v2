import React, { Suspense, lazy, useState, useCallback } from 'react';
import { BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom';
import { OllamaSplash } from './components/OllamaSplash';

function RouteTracker() {
  const location = useLocation();
  React.useEffect(() => {
    if (location.pathname !== '/') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location]);
  return null;
}

// Rutas retiradas del OS (módulos Vault y Coding eliminados): redirigir al shell principal
const RETIRED_ROUTES = ['/vault', '/coding'];

function InitialRedirect() {
  let lastRoute = localStorage.getItem('lastRoute') || '/agent-os';
  if (RETIRED_ROUTES.includes(lastRoute)) {
    lastRoute = '/agent-os';
    localStorage.setItem('lastRoute', lastRoute);
  }
  return <Navigate to={lastRoute} replace />;
}
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InteractiveTour } from './components/InteractiveTour';
import { GlobalTTSListener } from './components/GlobalTTSListener';

const AgentOS = lazy(() => import('./pages/AgentOS'));
const Academy = lazy(() => import('./pages/Academy'));
const Architecture = lazy(() => import('./pages/Architecture'));
const Automations = lazy(() => import('./pages/Automations'));
const CoautorIA = lazy(() => import('./pages/CoautorIA'));
const Setup = lazy(() => import('./pages/Setup'));

import { applyThemeToDocument } from './lib/themes';

function MainContent() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      {path === '/' && <InitialRedirect />}
      <div style={{ display: path === '/agent-os' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <AgentOS />
      </div>
      <div style={{ display: path === '/academy' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Academy />
      </div>
      <div style={{ display: path === '/architecture' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Architecture />
      </div>
      <div style={{ display: path === '/automations' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Automations />
      </div>
      <div style={{ display: path === '/coautoria' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <CoautorIA />
      </div>
      <div style={{ display: path === '/setup' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Setup />
      </div>
    </>
  );
}

function App(): React.ReactElement {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('builderTheme') || 'Deep Space';
    applyThemeToDocument(savedTheme);
  }, []);
  const [runTour, setRunTour] = React.useState(() => {
    return localStorage.getItem('tourCompleted') !== 'true';
  });

  // Splash: show while Ollama is loading on startup
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashReady = useCallback(() => setSplashDone(true), []);

  const handleTourComplete = () => {
    localStorage.setItem('tourCompleted', 'true');
    setRunTour(false);
  };

  if (!splashDone) {
    return <OllamaSplash onReady={handleSplashReady} />;
  }

  return (
    <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <GlobalTTSListener />
      <RouteTracker />
      <InteractiveTour runTour={runTour} onComplete={handleTourComplete} />
      <div className="flex h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden h-screen relative bg-[var(--surface-canvas)]">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)] font-mono text-sm">
                Loading...
              </div>
            }
          >
            <ErrorBoundary>
              <MainContent />
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
