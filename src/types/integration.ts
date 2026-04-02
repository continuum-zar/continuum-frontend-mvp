export type IntegrationProvider = 'discord';

export interface Integration {
  id: number;
  project_id: number;
  integration_type: IntegrationProvider;
  webhook_url: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationCreate {
  integration_type: IntegrationProvider;
  webhook_url: string;
  is_enabled?: boolean;
}

export interface IntegrationUpdate {
  webhook_url?: string;
  is_enabled?: boolean;
}
