import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
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
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-md w-full"
          >
            <Card className="border-destructive/20 shadow-lg overflow-hidden">
              <div className="h-2 bg-destructive" />
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Something went wrong</CardTitle>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  An unexpected error occurred while rendering this page. We've been notified and are looking into it.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground/80 bg-muted/30 p-4 m-6 rounded-md border border-border/50">
                <p className="break-words">
                  {getUserErrorMessage(
                    this.state.error,
                    'An unexpected error occurred while rendering this page.',
                  )}
                </p>
                {this.state.error?.message && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground/60 select-none">
                      Technical details
                    </summary>
                    <p className="font-mono text-xs break-words mt-2">
                      {this.state.error.message}
                    </p>
                    {getErrorCorrelationId(this.state.error) && (
                      <p className="font-mono text-xs mt-1">
                        Error ID: {getErrorCorrelationId(this.state.error)}
                      </p>
                    )}
                  </details>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-8 px-6">
                <Button
                  variant="outline"
                  className="w-full sm:w-1/2 flex items-center justify-center gap-2 h-11"
                  onClick={this.handleGoHome}
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
                <Button
                  variant="default"
                  className="w-full sm:w-1/2 flex items-center justify-center gap-2 h-11"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
