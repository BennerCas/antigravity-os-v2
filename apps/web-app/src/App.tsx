import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

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
const Vault = lazy(() => import('./pages/Vault'));
const Coding = lazy(() => import('./pages/Coding'));
const Architecture = lazy(() => import('./pages/Architecture'));
const Automations = lazy(() => import('./pages/Automations'));

import { applyThemeToDocument } from './lib/themes';

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
              <Routes>
              <Route path="/" element={<InitialRedirect />} />
              <Route path="/atlas" element={<Atlas />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/flows" element={<Flows />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/coding" element={<Coding />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/automations" element={<Automations />} />
            </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
