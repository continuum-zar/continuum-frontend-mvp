import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { RoleProvider } from './context/RoleContext';
import { useAuthStore } from '@/store/authStore';

import { ErrorBoundary } from './ErrorBoundary';
import { CustomCursorOverlay } from './components/CustomCursorOverlay';
import { MobileDesktopOnlyGate } from './components/MobileDesktopOnlyGate';
import { AuthQueryCacheSync } from './components/AuthQueryCacheSync';
import { DeploymentScheduledAlert } from './components/deployments/DeploymentScheduledAlert';

function App() {
  const { checkAuth } = useAuthStore();
  useEffect(() => {
    checkAuth().catch((error) => {
      console.error('Initial auth check failed:', error);
    });
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <RoleProvider>
        <TimeTrackingProvider>
          <AuthQueryCacheSync />
          <DeploymentScheduledAlert />
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
