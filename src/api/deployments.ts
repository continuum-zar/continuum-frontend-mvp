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
 * Browser EventSource cannot send Authorization headers; backend accepts `access_token` query.
 */
export function deploymentEventsStreamUrl(accessToken: string): string {
  const base = resolveApiBaseURL().replace(/\/$/, "");
  const qs = new URLSearchParams({ access_token: accessToken }).toString();
  const path = `${base}/events/stream`;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${path}?${qs}`;
  }
  if (typeof window === "undefined") {
    return `${path}?${qs}`;
  }
  return `${window.location.origin}${path}?${qs}`;
}
