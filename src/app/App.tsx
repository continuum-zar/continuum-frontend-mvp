import { lazy, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { RoleProvider } from './context/RoleContext';

import { ErrorBoundary } from './ErrorBoundary';
import { CustomCursorOverlay } from './components/CustomCursorOverlay';
import { MobileDesktopOnlyGate } from './components/MobileDesktopOnlyGate';
import { AuthQueryCacheSync } from './components/AuthQueryCacheSync';

/**
 * SSE listener is a non-critical background feature — lazy-load it so the
 * EventSource module doesn't sit on the initial JS chunk, and gate mounting
 * so it only opens a connection after hydration + the first paint.
 */
const DeploymentScheduledAlert = lazy(() =>
  import('./components/deployments/DeploymentScheduledAlert').then((m) => ({
    default: m.DeploymentScheduledAlert,
  })),
);

function App() {
  // checkAuth is owned by AuthGuard — calling it here too produced duplicate
  // /users/me pings and a race under StrictMode. Public routes (e.g. /login)
  // don't need an eager session ping at all.
  return (
    <ErrorBoundary>
      <RoleProvider>
        <TimeTrackingProvider>
          <AuthQueryCacheSync />
          <Suspense fallback={null}>
            <DeploymentScheduledAlert />
          </Suspense>
          <MobileDesktopOnlyGate>
            <RouterProvider router={router} />
          </MobileDesktopOnlyGate>
          <CustomCursorOverlay />
          <Toaster />
        </TimeTrackingProvider>
      </RoleProvider>
    </ErrorBoundary>
  );
}

export default App;
