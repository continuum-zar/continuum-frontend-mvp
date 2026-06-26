import api from '@/lib/api';

/**
 * Short-lived single-use opaque token for opening an EventSource.
 *
 * Browsers cannot set `Authorization` on EventSource. Passing the raw JWT
 * in `?access_token=` leaks it into proxy access logs / browser history /
 * Referer headers. The backend mints a 30s ticket bound to the calling user
 * via `POST /events/sse-ticket`; we redeem it on the SSE connect URL.
 */
export interface SseTicketResponse {
  ticket: string;
  expires_in: number;
}

/**
 * Fetch a fresh SSE ticket.
 *
 * Tickets are single-use (the backend redeems them atomically with GETDEL), so
 * every caller must get its own. We deliberately do NOT dedupe concurrent
 * callers: sharing one in-flight request handed the same single-use ticket to
 * multiple EventSource connects, and the second connect was rejected as already
 * redeemed — flaky realtime. Each call mints a distinct ticket; do not cache
 * across reconnects.
 */
export async function getSseTicket(): Promise<string> {
  const { data } = await api.post<SseTicketResponse>('/events/sse-ticket');
  return data.ticket;
}
