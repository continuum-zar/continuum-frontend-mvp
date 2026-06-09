import * as Sentry from "@sentry/react";

import { resolveApiBaseURL } from "./api";

/** Stable error codes the API uses for client-side conditions we don't want to alert on. */
const EXPECTED_API_ERROR_CODES = new Set([
  "VALIDATION_ERROR",
  "RATE_LIMIT_EXCEEDED",
  "SESSION_EXPIRED",
  "INVALID_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_REVOKED",
  "SESSION_INVALIDATED_BY_DEPLOY",
]);

const EXPECTED_AXIOS_STATUSES = new Set([401, 403, 404, 422, 429]);

function isStaleChunkMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("dynamically imported module") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("loading chunk") ||
    m.includes("loading css chunk")
  );
}

function beforeSend(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent | null {
  const original = hint.originalException as
    | (Error & {
        response?: { status?: number; data?: { code?: string } };
        isAxiosError?: boolean;
      })
    | undefined;

  // Drop stale-chunk reload errors — RouterStaleChunkErrorRecovery handles them and
  // they are an expected consequence of a deploy, not a real bug.
  const message =
    (typeof event.message === "string" && event.message) ||
    (original instanceof Error ? original.message : "");
  if (message && isStaleChunkMessage(message)) {
    return null;
  }

  // Drop expected axios errors so the dashboard isn't dominated by 401/429/etc.
  if (original?.isAxiosError) {
    const status = original.response?.status;
    if (typeof status === "number" && EXPECTED_AXIOS_STATUSES.has(status)) {
      return null;
    }
    const code = original.response?.data?.code;
    if (typeof code === "string" && EXPECTED_API_ERROR_CODES.has(code)) {
      return null;
    }
  }

  return event;
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    tracePropagationTargets: [
      "localhost",
      /^\/api\//,
      resolveApiBaseURL(),
    ].filter(Boolean),
    beforeSend,
  });
}

/** Tag the active scope with the current user; call from the auth store after login + on logout. */
export function setSentryUser(user: { id: string | number; email?: string } | null): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  if (user) {
    Sentry.setUser({ id: String(user.id), email: user.email });
  } else {
    Sentry.setUser(null);
  }
}
