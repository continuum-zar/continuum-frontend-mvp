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
 *
 * See ``projectTaskEventsStreamUrl`` for the cookie/query-param migration story.
 * Pass ``null`` for ``accessToken`` on cookie-authed clients.
 */
export function projectPresenceEventsStreamUrl(
  projectId: number | string,
  accessToken: string | null,
): string {
  const base = resolveApiBaseURL().replace(/\/$/, "");
  const path = `${base}/projects/${projectId}/presence-events/stream`;
  const qs = accessToken ? `?${new URLSearchParams({ access_token: accessToken }).toString()}` : "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${path}${qs}`;
  }
  if (typeof window === "undefined") {
    return `${path}${qs}`;
  }
  return `${window.location.origin}${path}${qs}`;
}
