import { resolveApiBaseURL } from "@/lib/api";
import { getSseTicket } from "@/api/sseTicket";

export type ProjectPresenceEventType =
  | "session_started"
  | "session_paused"
  | "session_resumed"
  | "session_stopped";

export interface ProjectPresenceEvent {
  type: ProjectPresenceEventType;
  project_id: number;
  session_id: number;
  user_id: number;
  status: string;
  occurred_at: string;
}

/**
 * SSE stream URL for per-project work-session presence updates.
 *
 * EventSource cannot send custom headers; we mint a short-lived single-use
 * ticket via `POST /events/sse-ticket` and pass it via `?ticket=` rather
 * than embedding the JWT (which leaks into access logs / browser history).
 */
export async function projectPresenceEventsStreamUrl(projectId: number | string): Promise<string> {
  const base = resolveApiBaseURL().replace(/\/$/, "");
  const ticket = await getSseTicket();
  const qs = new URLSearchParams({ ticket }).toString();
  const path = `${base}/projects/${projectId}/presence-events/stream`;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${path}?${qs}`;
  }
  if (typeof window === "undefined") {
    return `${path}?${qs}`;
  }
  return `${window.location.origin}${path}?${qs}`;
}
