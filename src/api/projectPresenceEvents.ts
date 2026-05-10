import { resolveApiBaseURL } from "@/lib/api";

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
 * EventSource cannot send custom headers; pass JWT via `access_token` query param.
 */
export function projectPresenceEventsStreamUrl(projectId: number | string, accessToken: string): string {
  const base = resolveApiBaseURL().replace(/\/$/, "");
  const qs = new URLSearchParams({ access_token: accessToken }).toString();
  const path = `${base}/projects/${projectId}/presence-events/stream`;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${path}?${qs}`;
  }
  if (typeof window === "undefined") {
    return `${path}?${qs}`;
  }
  return `${window.location.origin}${path}?${qs}`;
}
