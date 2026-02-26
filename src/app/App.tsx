import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { RoleProvider } from './context/RoleContext';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from './components/ui/skeleton';

function App() {
  const { checkAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Initial auth check failed:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [checkAuth]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleProvider>
      <TimeTrackingProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TimeTrackingProvider>
    </RoleProvider>
  );
}

export default App;
