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

let inFlight: Promise<string> | null = null;

/**
 * Fetch a fresh SSE ticket. Concurrent callers within the same tick share one
 * request — the ticket is single-use, so each consumer still gets its own
 * after the first lands (a subsequent call returns a new ticket).
 *
 * Each EventSource needs its own ticket; do not cache across reconnects.
 */
export async function getSseTicket(): Promise<string> {
  if (inFlight) {
    const t = await inFlight;
    inFlight = null;
    return t;
  }
  inFlight = (async () => {
    const { data } = await api.post<SseTicketResponse>('/events/sse-ticket');
    return data.ticket;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
