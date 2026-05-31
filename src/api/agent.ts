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
 * Cookie-authed users (post Continuum #1301) authenticate via the HttpOnly access
 * cookie when EventSource has ``withCredentials: true``. Legacy users still pass the
 * JWT via ``access_token`` query param. Pass ``null`` for the cookie-only path.
 */
export function agentRunEventsStreamUrl(
  taskId: number | string,
  runId: string,
  accessToken: string | null,
): string {
  const base = resolveApiBaseURL().replace(/\/$/, '');
  const path = `${base}/tasks/${taskId}/agent/runs/${runId}/events`;
  const qs = accessToken ? `?${new URLSearchParams({ access_token: accessToken }).toString()}` : '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}${qs}`;
  }
  if (typeof window === 'undefined') {
    return `${path}${qs}`;
  }
  return `${window.location.origin}${path}${qs}`;
}
