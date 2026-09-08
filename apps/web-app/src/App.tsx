import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom';

function RouteTracker() {
  const location = useLocation();
  React.useEffect(() => {
    if (location.pathname !== '/') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location]);
  return null;
}

function InitialRedirect() {
  const lastRoute = localStorage.getItem('lastRoute') || '/atlas';
  return <Navigate to={lastRoute} replace />;
}
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InteractiveTour } from './components/InteractiveTour';

const Atlas = lazy(() => import('./pages/Atlas'));
const Agents = lazy(() => import('./pages/Agents'));
const Flows = lazy(() => import('./pages/Flows'));
const Builder = lazy(() => import('./pages/Builder'));
const Academy = lazy(() => import('./pages/Academy'));
const Vault = lazy(() => import('./pages/Vault'));
const Coding = lazy(() => import('./pages/Coding'));
const Architecture = lazy(() => import('./pages/Architecture'));
const Automations = lazy(() => import('./pages/Automations'));

import { applyThemeToDocument } from './lib/themes';

function MainContent() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      {path === '/' && <InitialRedirect />}
      <div style={{ display: path === '/atlas' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Atlas />
      </div>
      <div style={{ display: path === '/agents' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Agents />
      </div>
      <div style={{ display: path === '/flows' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Flows />
      </div>
      <div style={{ display: path === '/builder' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Builder />
      </div>
      <div style={{ display: path === '/academy' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Academy />
      </div>
      <div style={{ display: path === '/vault' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Vault />
      </div>
      <div style={{ display: path === '/coding' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Coding />
      </div>
      <div style={{ display: path === '/architecture' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Architecture />
      </div>
      <div style={{ display: path === '/automations' ? 'block' : 'none', height: '100%', width: '100%' }}>
        <Automations />
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

  const handleTourComplete = () => {
    localStorage.setItem('tourCompleted', 'true');
    setRunTour(false);
  };

  return (
    <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <RouteTracker />
      <InteractiveTour runTour={runTour} onComplete={handleTourComplete} />
      <div className="flex h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto h-screen relative bg-[var(--surface-canvas)]">
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
