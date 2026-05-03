import { resolveApiBaseURL } from '@/lib/api';

/**
 * SSE stream URL for per-project task updates (Redis pub/sub on the API).
 * EventSource cannot send custom headers; pass JWT via `access_token` query param.
 */
export function projectTaskEventsStreamUrl(projectId: number | string, accessToken: string): string {
  const base = resolveApiBaseURL().replace(/\/$/, '');
  const qs = new URLSearchParams({ access_token: accessToken }).toString();
  const path = `${base}/projects/${projectId}/task-events/stream`;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}?${qs}`;
  }
  if (typeof window === 'undefined') {
    return `${path}?${qs}`;
  }
  return `${window.location.origin}${path}?${qs}`;
}
