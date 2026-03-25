import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { RoleProvider } from './context/RoleContext';
import { useAuthStore } from '@/store/authStore';

import { ErrorBoundary } from './ErrorBoundary';
import { MobileDesktopOnlyGate } from './components/MobileDesktopOnlyGate';

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
          <MobileDesktopOnlyGate>
            <RouterProvider router={router} />
          </MobileDesktopOnlyGate>
          <Toaster />
        </TimeTrackingProvider>
      </RoleProvider>
    </ErrorBoundary>
  );
}

export default App;
