export type IntegrationProvider = 'discord';

/** Matches backend `notification_triggers` keys (Discord). */
export interface NotificationTriggers {
  project_renamed: boolean;
  project_member_joined: boolean;
  project_member_removed: boolean;
  task_created: boolean;
  task_status_changed: boolean;
  task_assignee_changed: boolean;
  task_deleted: boolean;
  task_comment_added: boolean;
  milestone_created: boolean;
  milestone_updated: boolean;
  milestone_deleted: boolean;
}

/** Defaults for a new integration (all enabled). */
export const DEFAULT_NOTIFICATION_TRIGGERS: NotificationTriggers = {
  project_renamed: true,
  project_member_joined: true,
  project_member_removed: true,
  task_created: true,
  task_status_changed: true,
  task_assignee_changed: true,
  task_deleted: true,
  task_comment_added: true,
  milestone_created: true,
  milestone_updated: true,
  milestone_deleted: true,
};

export interface Integration {
  id: number;
  project_id: number;
  integration_type: IntegrationProvider;
  webhook_url: string;
  is_enabled: boolean;
  notification_triggers: NotificationTriggers;
  created_at: string;
  updated_at: string;
}

export interface IntegrationCreate {
  integration_type: IntegrationProvider;
  webhook_url: string;
  is_enabled?: boolean;
  notification_triggers?: Partial<NotificationTriggers>;
}

export interface IntegrationUpdate {
  webhook_url?: string;
  is_enabled?: boolean;
  notification_triggers?: Partial<NotificationTriggers>;
}
