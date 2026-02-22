import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { TimeTrackingProvider } from './context/TimeTrackingContext';

function App() {
  return (
    <TimeTrackingProvider>
      <RouterProvider router={router} />
      <Toaster />
    </TimeTrackingProvider>
  );
}

export default App;
