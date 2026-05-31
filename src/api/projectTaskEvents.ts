import { resolveApiBaseURL } from '@/lib/api';

/**
 * SSE stream URL for per-project task updates (Redis pub/sub on the API).
 *
 * Cookie-authed users (post Continuum #1301) authenticate via the HttpOnly access
 * cookie that the browser sends when EventSource has ``withCredentials: true``.
 * Legacy users still pass the JWT via ``access_token`` query param, which the backend
 * accepts during the migration window. Pass ``null`` for the cookie-only path.
 */
export function projectTaskEventsStreamUrl(
  projectId: number | string,
  accessToken: string | null,
): string {
  const base = resolveApiBaseURL().replace(/\/$/, '');
  const path = `${base}/projects/${projectId}/task-events/stream`;
  const qs = accessToken ? `?${new URLSearchParams({ access_token: accessToken }).toString()}` : '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}${qs}`;
  }
  if (typeof window === 'undefined') {
    return `${path}${qs}`;
  }
  return `${window.location.origin}${path}${qs}`;
}
