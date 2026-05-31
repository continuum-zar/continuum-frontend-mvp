import api from "@/lib/api";
import { resolveApiBaseURL } from "@/lib/api";

export type DeploymentScheduleResponse = {
  scheduled_at: string;
  minutes_until: number;
};

export async function scheduleDeployment(): Promise<DeploymentScheduleResponse> {
  const { data } = await api.post<DeploymentScheduleResponse>("/admin/deployments/schedule");
  return data;
}

export type InvalidateSessionsResponse = {
  auth_deployment_epoch: number;
};

/**
 * Bump server auth epoch so all JWTs (including the current session) stop working.
 * Call after a production deploy so users re-authenticate and see new release notes.
 */
export async function invalidateAllSessions(): Promise<InvalidateSessionsResponse> {
  const { data } = await api.post<InvalidateSessionsResponse>("/admin/deployments/invalidate-sessions");
  return data;
}

/**
 * SSE stream URL for deployment notifications.
 *
 * Cookie-authed users (post Continuum #1301) authenticate via the HttpOnly access
 * cookie when EventSource has ``withCredentials: true``. Legacy users still pass the
 * JWT via ``access_token`` query param. Pass ``null`` for cookie-only.
 */
export function deploymentEventsStreamUrl(accessToken: string | null): string {
  const base = resolveApiBaseURL().replace(/\/$/, "");
  const path = `${base}/events/stream`;
  const qs = accessToken ? `?${new URLSearchParams({ access_token: accessToken }).toString()}` : "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${path}${qs}`;
  }
  if (typeof window === "undefined") {
    return `${path}${qs}`;
  }
  return `${window.location.origin}${path}${qs}`;
}
