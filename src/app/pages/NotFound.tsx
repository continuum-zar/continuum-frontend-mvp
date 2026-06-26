import { useNavigate } from 'react-router';
import { WORKSPACE_BASE } from '@/lib/workspacePaths';
import {
  ErrorDialog,
  ERROR_DIALOG_PRESETS,
  errorDialogActions,
} from '../components/ui/error-dialog';

export function NotFound() {
  const navigate = useNavigate();

  const goHome = () => navigate(WORKSPACE_BASE);
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(WORKSPACE_BASE);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ErrorDialog
        {...ERROR_DIALOG_PRESETS.notFound}
        open
        // Closing via the header arrow returns the user to a real page.
        onOpenChange={(next) => {
          if (!next) goBack();
        }}
        primaryAction={errorDialogActions.goHome(goHome)}
        secondaryAction={errorDialogActions.goBack(goBack)}
      />
    </div>
  );
}
