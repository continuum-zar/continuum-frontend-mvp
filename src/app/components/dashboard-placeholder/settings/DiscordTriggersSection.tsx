"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import {
  useProjectIntegrations,
  useUpdateIntegration,
} from "@/api/hooks";
import {
  DEFAULT_NOTIFICATION_TRIGGERS,
  type NotificationTriggers,
} from "@/types/integration";

import { cn } from "../../ui/utils";

const SECTIONS: {
  title: string;
  items: { key: keyof NotificationTriggers; label: string }[];
}[] = [
  {
    title: "Project",
    items: [
      { key: "project_renamed", label: "Project renamed" },
      { key: "project_member_joined", label: "Member joined" },
      { key: "project_member_removed", label: "Member removed" },
    ],
  },
  {
    title: "Tasks",
    items: [
      { key: "task_created", label: "Task created" },
      { key: "task_status_changed", label: "Task status changed" },
      { key: "task_assignee_changed", label: "Assignee changed" },
      { key: "task_deleted", label: "Task deleted" },
      { key: "task_comment_added", label: "Comment added" },
    ],
  },
  {
    title: "Milestones",
    items: [
      { key: "milestone_created", label: "Milestone created" },
      { key: "milestone_updated", label: "Milestone updated" },
      { key: "milestone_deleted", label: "Milestone deleted" },
    ],
  },
];

type DiscordTriggersSectionProps = {
  /** Project the Discord triggers belong to. When null, an empty state is shown. */
  projectId: number | null;
  /** When true, render checklist rows aligned to the notifications table columns. */
  renderAsNotificationRows?: boolean;
  /** Optional CTA shown when a project has no Discord webhook linked yet. */
  onSetupWebhook?: () => void;
};

export function DiscordTriggersSection({
  projectId,
  renderAsNotificationRows = false,
  onSetupWebhook,
}: DiscordTriggersSectionProps) {
  const integrationsQuery = useProjectIntegrations(projectId);
  const discordIntegration = integrationsQuery.data?.find(
    (i) => i.integration_type === "discord",
  );
  const updateIntegration = useUpdateIntegration(projectId);

  const [triggers, setTriggers] = useState<NotificationTriggers>(
    DEFAULT_NOTIFICATION_TRIGGERS,
  );
  const hydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (projectId == null) {
      hydratedKeyRef.current = null;
      setTriggers(DEFAULT_NOTIFICATION_TRIGGERS);
      return;
    }
    if (!integrationsQuery.isSuccess) return;
    const key = `${projectId}:${discordIntegration?.id ?? "none"}`;
    if (hydratedKeyRef.current === key) return;
    hydratedKeyRef.current = key;
    if (discordIntegration?.notification_triggers) {
      setTriggers({
        ...DEFAULT_NOTIFICATION_TRIGGERS,
        ...discordIntegration.notification_triggers,
      });
    } else {
      setTriggers(DEFAULT_NOTIFICATION_TRIGGERS);
    }
  }, [
    projectId,
    integrationsQuery.isSuccess,
    discordIntegration?.id,
    discordIntegration?.notification_triggers,
  ]);

  const savedTriggers = useMemo<NotificationTriggers>(
    () => ({
      ...DEFAULT_NOTIFICATION_TRIGGERS,
      ...(discordIntegration?.notification_triggers ?? {}),
    }),
    [discordIntegration?.notification_triggers],
  );

  const dirty = useMemo(() => {
    return (Object.keys(triggers) as (keyof NotificationTriggers)[]).some(
      (k) => triggers[k] !== savedTriggers[k],
    );
  }, [triggers, savedTriggers]);

  const toggle = (key: keyof NotificationTriggers) => {
    setTriggers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!discordIntegration) return;
    updateIntegration.mutate({
      integrationId: discordIntegration.id,
      body: { notification_triggers: triggers },
    });
  };

  const handleReset = () => {
    setTriggers(savedTriggers);
  };

  if (projectId == null) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#ebedee] bg-[#f9f9f9] px-4 py-6 text-center">
        <p className="font-['Satoshi',sans-serif] text-[14px] text-[#606d76]">
          Select a project above to choose which events post to its Discord
          channel.
        </p>
      </div>
    );
  }

  if (integrationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-[14px] text-[#606d76]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading Discord settings…
      </div>
    );
  }

  if (integrationsQuery.isError) {
    return (
      <div className="rounded-[8px] border border-[#ebedee] bg-[#f9f9f9] px-4 py-4">
        <p className="font-['Satoshi',sans-serif] text-[14px] text-[#0b191f]">
          Couldn’t load Discord settings. Try again later.
        </p>
      </div>
    );
  }

  const noWebhook = !discordIntegration;
  const busy = updateIntegration.isPending;

  const renderChecklist = () => {
    if (renderAsNotificationRows) {
      return (
        <div className="flex flex-col divide-y divide-[#ebedee]">
          {SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col">
              <div className="py-2 pl-4">
                <p className="font-['Satoshi',sans-serif] text-[12px] font-semibold uppercase tracking-[0.04em] text-[#606d76]">
                  {section.title}
                </p>
              </div>
              {section.items.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex w-full items-center gap-6 py-2 pl-4"
                >
                  <p className="min-w-0 flex-1 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#131617]">
                    {label}
                  </p>
                  <div className="flex w-[120px] shrink-0 items-center">
                    <span
                      className="font-['Satoshi',sans-serif] text-[12px] text-[#9fa5a8]"
                      aria-hidden
                    >
                      —
                    </span>
                  </div>
                  <div className="flex w-[120px] shrink-0 items-center">
                    <button
                      type="button"
                      aria-pressed={triggers[key]}
                      onClick={() => toggle(key)}
                      disabled={noWebhook}
                      className="flex cursor-pointer items-center gap-2 rounded-[4px] py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-solid transition-colors",
                          triggers[key]
                            ? "border-0 text-white"
                            : "border-[#ebedee] bg-[#f9f9f9]",
                        )}
                        style={
                          triggers[key]
                            ? {
                                backgroundImage:
                                  "linear-gradient(141.68deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(85, 33, 254) 0%, rgb(85, 33, 254) 100%)",
                              }
                            : undefined
                        }
                        aria-hidden
                      >
                        {triggers[key] ? (
                          <Check className="size-[13px]" strokeWidth={2.5} />
                        ) : null}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        aria-disabled={noWebhook}
        className={cn(
          "flex flex-col gap-4",
          noWebhook ? "pointer-events-none opacity-50" : null,
        )}
      >
        {SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <p className="font-['Satoshi',sans-serif] text-[13px] font-semibold text-[#252014]">
              {section.title}
            </p>
            <ul className="flex flex-col gap-2 pl-0.5">
              {section.items.map(({ key, label }) => (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={triggers[key]}
                    onClick={() => toggle(key)}
                    disabled={noWebhook}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-[4px] py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-solid transition-colors",
                        triggers[key]
                          ? "border-0 text-white"
                          : "border-[#ebedee] bg-[#f9f9f9]",
                      )}
                      style={
                        triggers[key]
                          ? {
                              backgroundImage:
                                "linear-gradient(141.68deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(85, 33, 254) 0%, rgb(85, 33, 254) 100%)",
                            }
                          : undefined
                      }
                      aria-hidden
                    >
                      {triggers[key] ? (
                        <Check className="size-[13px]" strokeWidth={2.5} />
                      ) : null}
                    </span>
                    <span className="font-['Satoshi',sans-serif] text-[14px] font-normal leading-[19px] text-[#0b191f]">
                      {label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col", renderAsNotificationRows ? null : "gap-4")}>
      {!renderAsNotificationRows && noWebhook ? (
        <div className="flex flex-col gap-2 rounded-[8px] border border-dashed border-[#ebedee] bg-[#f9f9f9] px-4 py-4">
          <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
            No Discord webhook linked for this project
          </p>
          <p className="font-['Satoshi',sans-serif] text-[13px] leading-normal text-[#606d76]">
            Connect a webhook in the Integrations tab to start sending
            notifications to a Discord channel.
          </p>
          {onSetupWebhook ? (
            <div>
              <button
                type="button"
                onClick={onSetupWebhook}
                className="mt-1 inline-flex h-9 items-center rounded-[8px] border border-[#ebedee] bg-white px-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] outline-none ring-offset-2 transition-colors hover:bg-[#f5f7f8] focus-visible:ring-2 focus-visible:ring-ring"
              >
                Set up in Integrations
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {renderChecklist()}

      {!noWebhook && dirty ? (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleReset}
            disabled={busy}
            className="inline-flex h-9 items-center rounded-[8px] border border-[#ebedee] bg-white px-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] outline-none ring-offset-2 transition-colors hover:bg-[#f5f7f8] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="inline-flex h-9 items-center justify-center rounded-[8px] bg-[#0b191f] px-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#fcfbf8] outline-none ring-offset-2 transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              "Save Discord triggers"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
