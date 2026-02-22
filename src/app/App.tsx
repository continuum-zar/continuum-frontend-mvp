import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { RoleProvider } from './context/RoleContext';

function App() {
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
