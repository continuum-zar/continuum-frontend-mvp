import { resolveApiBaseURL } from '@/lib/api';
import { getSseTicket } from '@/api/sseTicket';

/**
 * SSE stream URL for per-project task updates (Redis pub/sub on the API).
 *
 * EventSource cannot send custom headers, so we mint a short-lived single-use
 * ticket via `POST /events/sse-ticket` and pass that via `?ticket=` rather
 * than embedding the JWT in the URL (which leaks into proxy access logs,
 * browser history, and Referer headers).
 */
export async function projectTaskEventsStreamUrl(projectId: number | string): Promise<string> {
  const base = resolveApiBaseURL().replace(/\/$/, '');
  const ticket = await getSseTicket();
  const qs = new URLSearchParams({ ticket }).toString();
  const path = `${base}/projects/${projectId}/task-events/stream`;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}?${qs}`;
  }
  if (typeof window === 'undefined') {
    return `${path}?${qs}`;
  }
  return `${window.location.origin}${path}?${qs}`;
}
