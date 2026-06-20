import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import {
  ErrorDialog,
  ERROR_DIALOG_PRESETS,
  errorDialogActions,
} from './components/ui/error-dialog';
import { getErrorCorrelationId, getUserErrorMessage } from '../lib/errorMessages';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack ?? '' } },
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const message = getUserErrorMessage(
        this.state.error,
        'An unexpected error occurred while rendering this page.',
      );
      const correlationId = getErrorCorrelationId(this.state.error);

      return (
        <div className="min-h-screen w-full bg-background">
          <ErrorDialog
            {...ERROR_DIALOG_PRESETS.generic}
            description={message}
            correlationId={correlationId}
            technicalDetails={this.state.error?.message || undefined}
            // Hard render failure — keep the dialog anchored; only the actions move you on.
            open
            hideClose
            dismissible={false}
            onOpenChange={() => {}}
            primaryAction={errorDialogActions.retry(this.handleRetry)}
            secondaryAction={errorDialogActions.goHome(this.handleGoHome)}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
