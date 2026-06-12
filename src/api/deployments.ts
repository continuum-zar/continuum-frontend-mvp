import api from "@/lib/api";
import { resolveApiBaseURL } from "@/lib/api";
import { getSseTicket } from "@/api/sseTicket";

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
 * Resolve the SSE URL for the deployment-events stream.
 *
 * Browsers can't send Authorization headers on EventSource, so we mint a
 * short-lived single-use ticket via `POST /events/sse-ticket` and pass that
 * via `?ticket=` instead of putting the JWT in the URL.
 */
export async function deploymentEventsStreamUrl(): Promise<string> {
  const base = resolveApiBaseURL().replace(/\/$/, "");
  const ticket = await getSseTicket();
  const qs = new URLSearchParams({ ticket }).toString();
  const path = `${base}/events/stream`;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${path}?${qs}`;
  }
  if (typeof window === "undefined") {
    return `${path}?${qs}`;
  }
  return `${window.location.origin}${path}?${qs}`;
}
