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
