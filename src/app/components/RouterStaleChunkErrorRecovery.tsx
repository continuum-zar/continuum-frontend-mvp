import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";
import * as Sentry from "@sentry/react";
import { isStaleClientChunkError, tryReloadForStaleChunk } from "@/lib/staleClientChunk";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { Button } from "./ui/button";

function routeErrorToUnknown(error: ReturnType<typeof useRouteError>): unknown {
  if (isRouteErrorResponse(error)) {
    return new Error(error.statusText || String(error.status));
  }
  return error;
}

/**
 * React Router `errorElement` for stale lazy chunks (e.g. after a deploy).
 * Attempts a hard reload before falling back to a minimal recovery UI.
 */
export function RouterStaleChunkErrorRecovery() {
  const routeError = useRouteError();
  const error = routeErrorToUnknown(routeError);
  const isChunk = isStaleClientChunkError(error);

  useEffect(() => {
    if (isChunk) {
      void tryReloadForStaleChunk();
      return;
    }
    // A real route error (not a stale chunk after deploy) — escalate to Sentry.
    Sentry.captureException(error);
  }, [isChunk, error]);

  const description = isChunk
    ? "This page could not load the latest version of the app. We tried refreshing automatically; if the problem continues, reload the page."
    : "An unexpected error occurred while loading this screen.";
  // Skip the extra box when the friendly message adds nothing over the description.
  const message = getUserErrorMessage(error, description);
  const showMessage = !isChunk && message !== description;
  const rawMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : undefined;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-lg font-semibold tracking-tight">
              {isChunk ? "Update required" : "Something went wrong"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            {showMessage && (
              <p className="text-sm text-muted-foreground/90 break-words rounded-md border border-border bg-muted/40 p-2">
                {message}
              </p>
            )}
            {rawMessage && rawMessage !== message && (
              <details className="text-xs text-muted-foreground/70">
                <summary className="cursor-pointer select-none">Technical details</summary>
                <p className="font-mono break-words mt-1">{rawMessage}</p>
              </details>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reload page
          </Button>
          <Button type="button" variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
