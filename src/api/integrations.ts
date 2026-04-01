import api from '@/lib/api';
import type { Integration, IntegrationCreate, IntegrationUpdate } from '@/types/integration';

/** Fetch all integrations for a project */
export async function fetchProjectIntegrations(projectId: string | number): Promise<Integration[]> {
  const { data } = await api.get<Integration[]>(`/projects/${projectId}/integrations`);
  return data;
}

/** Create a new integration for a project */
export async function createProjectIntegration(
  projectId: string | number,
  body: IntegrationCreate
): Promise<Integration> {
  const { data } = await api.post<Integration>(`/projects/${projectId}/integrations`, body);
  return data;
}

/** Update an existing integration */
export async function updateIntegration(
  projectId: string | number,
  integrationId: string | number,
  body: IntegrationUpdate
): Promise<Integration> {
  const { data } = await api.put<Integration>(`/projects/${projectId}/integrations/${integrationId}`, body);
  return data;
}

/** Delete an integration */
export async function deleteIntegration(projectId: string | number, integrationId: string | number): Promise<void> {
  await api.delete(`/projects/${projectId}/integrations/${integrationId}`);
}

/** Test an integration configuration */
export async function testIntegration(projectId: string | number, integrationId: string | number): Promise<{ success: boolean; message?: string }> {
  const { data } = await api.post<{ success: boolean; message?: string }>(`/projects/${projectId}/integrations/${integrationId}/test`);
  return data;
}

export const integrationKeys = {
  all: ['integrations'] as const,
  list: (projectId: string | number) => [...integrationKeys.all, 'list', projectId] as const,
  detail: (id: string | number) => [...integrationKeys.all, 'detail', id] as const,
};
