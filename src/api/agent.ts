import api, { resolveApiBaseURL } from '@/lib/api';
import type {
  AgentRun,
  AgentRunDetail,
  AgentRunListResponse,
  StartAgentRunBody,
} from '@/types/agentRun';

export async function startAgentRun(
  taskId: number | string,
  body: StartAgentRunBody,
): Promise<AgentRun> {
  const { data } = await api.post<AgentRun>(
    `/tasks/${taskId}/agent/runs`,
    body,
  );
  return data;
}

export async function listAgentRuns(
  taskId: number | string,
  params?: { limit?: number; offset?: number },
): Promise<AgentRunListResponse> {
  const { data } = await api.get<AgentRunListResponse>(
    `/tasks/${taskId}/agent/runs`,
    { params },
  );
  return data;
}

export async function fetchAgentRun(
  taskId: number | string,
  runId: string,
): Promise<AgentRunDetail> {
  const { data } = await api.get<AgentRunDetail>(
    `/tasks/${taskId}/agent/runs/${runId}`,
  );
  return data;
}

export async function cancelAgentRun(
  taskId: number | string,
  runId: string,
): Promise<AgentRun> {
  const { data } = await api.post<AgentRun>(
    `/tasks/${taskId}/agent/runs/${runId}/cancel`,
  );
  return data;
}

/**
 * SSE stream URL for a single agent run.
 *
 * EventSource cannot send custom headers, so the backend accepts the JWT via
 * an `access_token` query parameter (same pattern as deployment events).
 */
export function agentRunEventsStreamUrl(
  taskId: number | string,
  runId: string,
  accessToken: string,
): string {
  const base = resolveApiBaseURL().replace(/\/$/, '');
  const qs = new URLSearchParams({ access_token: accessToken }).toString();
  const path = `${base}/tasks/${taskId}/agent/runs/${runId}/events`;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}?${qs}`;
  }
  if (typeof window === 'undefined') {
    return `${path}?${qs}`;
  }
  return `${window.location.origin}${path}?${qs}`;
}
