"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  useCreateIntegration,
  useProjects,
  useProjectIntegrations,
  useTestIntegration,
  useUpdateIntegration,
} from "@/api/hooks";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";

const PRIMARY_GRADIENT =
  "linear-gradient(141.68deg, #24B5F8 -123.02%, #5521FE 802.55%)";

const DISCORD_LOGO = "/assets/brand-assets/discord-logo.svg";

type DiscordIntegrationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional initial project id when opening from context. */
  projectId?: number | null;
  /** Called when the project selection changes. */
  onProjectIdChange?: (projectId: number | null) => void;
};

export function DiscordIntegrationModal({
  open,
  onOpenChange,
  projectId,
  onProjectIdChange,
}: DiscordIntegrationModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    projectId ?? null,
  );
  const [webhookUrl, setWebhookUrl] = useState("");
  const hydratedFromServerRef = useRef(false);
  const projectsQuery = useProjects({ enabled: open });
  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );

  useEffect(() => {
    if (!open) return;
    if (projects.length === 0) {
      setSelectedProjectId(null);
      return;
    }
    setSelectedProjectId((prev) => {
      if (projectId != null && projects.some((p) => p.apiId === projectId)) {
        return projectId;
      }
      if (prev != null && projects.some((p) => p.apiId === prev)) return prev;
      return projects[0]?.apiId ?? null;
    });
  }, [open, projectId, projects]);

  useEffect(() => {
    onProjectIdChange?.(selectedProjectId);
  }, [selectedProjectId, onProjectIdChange]);

  const integrationsQuery = useProjectIntegrations(
    open && selectedProjectId != null ? selectedProjectId : null,
  );
  const discordIntegration = integrationsQuery.data?.find(
    (i) => i.integration_type === "discord",
  );

  const createIntegration = useCreateIntegration(selectedProjectId ?? null);
  const updateIntegration = useUpdateIntegration(selectedProjectId ?? null);
  const testIntegration = useTestIntegration(selectedProjectId ?? null);

  useEffect(() => {
    if (!open) {
      hydratedFromServerRef.current = false;
      return;
    }
    if (selectedProjectId == null) {
      setWebhookUrl("");
      return;
    }
    if (integrationsQuery.isLoading || !integrationsQuery.isSuccess) return;
    if (hydratedFromServerRef.current) return;
    hydratedFromServerRef.current = true;
    const d = integrationsQuery.data?.find(
      (i) => i.integration_type === "discord",
    );
    setWebhookUrl(d?.webhook_url ?? "");
  }, [
    open,
    selectedProjectId,
    integrationsQuery.isLoading,
    integrationsQuery.isSuccess,
    integrationsQuery.data,
  ]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setWebhookUrl("");
    }
    onOpenChange(next);
  };

  const trimmed = webhookUrl.trim();
  const canSubmit =
    selectedProjectId != null &&
    trimmed.length > 0 &&
    integrationsQuery.isSuccess &&
    !createIntegration.isPending &&
    !updateIntegration.isPending;

  const handleLink = () => {
    if (!canSubmit || selectedProjectId == null) return;
    if (discordIntegration) {
      updateIntegration.mutate(
        {
          integrationId: discordIntegration.id,
          body: { webhook_url: trimmed },
        },
        { onSuccess: () => handleClose(false) },
      );
    } else {
      createIntegration.mutate(
        {
          integration_type: "discord",
          webhook_url: trimmed,
        },
        { onSuccess: () => handleClose(false) },
      );
    }
  };

  const busy = createIntegration.isPending || updateIntegration.isPending;
  const primaryLabel = discordIntegration ? "Update" : "Link";

  const webhookMatchesSaved =
    discordIntegration != null &&
    trimmed === (discordIntegration.webhook_url ?? "").trim();
  const canTest =
    selectedProjectId != null &&
    discordIntegration != null &&
    integrationsQuery.isSuccess &&
    webhookMatchesSaved &&
    !busy &&
    !testIntegration.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,560px)] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white font-['Satoshi',sans-serif] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Discord webhook
          </DialogPrimitive.Title>

          <div className="grid w-full grid-cols-[20px_1fr_20px] shrink-0 items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-5 items-center justify-center text-[#606d76]"
                aria-label="Close"
              >
                <ArrowLeft className="size-5" />
              </button>
            </DialogClose>
            <div className="flex items-center justify-center gap-2">
              <img
                src={DISCORD_LOGO}
                alt=""
                aria-hidden
                className="size-5 shrink-0"
              />
              <p className="text-center text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Discord webhook
              </p>
            </div>
            <div className="size-5" aria-hidden />
          </div>

          <div
            className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            {selectedProjectId == null ? (
              <p className="text-left text-[15px] leading-relaxed text-[#606d76]">
                No project available yet. Create a project first, then link one
                Discord webhook per project.
              </p>
            ) : integrationsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-[#606d76]">
                <Loader2 className="size-5 animate-spin text-[#606d76]" />
                Loading…
              </div>
            ) : integrationsQuery.isError ? (
              <p className="text-[14px] text-[#0b191f]">
                Couldn’t load integration settings. Try again later.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1">
                  <span className="text-[14px] font-medium text-[#606d76]">
                    Project
                  </span>
                  <Select
                    value={selectedProjectId != null ? String(selectedProjectId) : ""}
                    onValueChange={(v) => setSelectedProjectId(v ? Number(v) : null)}
                    disabled={projects.length === 0 || projectsQuery.isLoading}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-10 w-full rounded-[8px] border border-[#e9e9e9] bg-white px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] shadow-none focus:ring-2 focus:ring-ring",
                        "[&_svg]:size-6 [&_svg]:opacity-100 [&_svg]:text-[#0b191f]",
                      )}
                      aria-label="Project for Discord webhook"
                    >
                      <SelectValue
                        placeholder={
                          projectsQuery.isLoading
                            ? "Loading projects…"
                            : "No projects available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[200] font-['Satoshi',sans-serif]">
                      {projects.map((p) => (
                        <SelectItem
                          key={p.apiId}
                          value={String(p.apiId)}
                          className="text-[16px] font-medium"
                        >
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <p className="text-[14px] leading-relaxed text-[#606d76]">
                  In Discord: Server Settings → Integrations → Webhooks. Paste
                  the webhook URL below and link it to this project. Choose
                  which events fire under Settings → Notifications.
                </p>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="discord-webhook-url"
                    className="text-[14px] font-medium text-[#606d76]"
                  >
                    Webhook URL
                  </label>
                  <input
                    id="discord-webhook-url"
                    type="url"
                    autoComplete="off"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="h-10 w-full rounded-[8px] border border-[#e9e9e9] bg-white px-4 text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#606d76]/40 focus-visible:border-[#1466ff] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#e5e7eb] bg-[#f9f9f9] px-9 py-4 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 text-[14px] font-semibold text-[#252014] transition-colors hover:bg-[#f5f7f8]"
              >
                Cancel
              </button>
            </DialogClose>
            {selectedProjectId != null && discordIntegration != null && (
              <button
                type="button"
                onClick={() => testIntegration.mutate(discordIntegration.id)}
                disabled={!canTest}
                className={cn(
                  "inline-flex h-10 min-w-[100px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 text-[14px] font-semibold text-[#252014] transition-colors",
                  canTest
                    ? "hover:bg-[#f5f7f8]"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                {testIntegration.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </button>
            )}
            {selectedProjectId != null && (
              <button
                type="button"
                onClick={handleLink}
                disabled={!canSubmit}
                style={
                  canSubmit ? { background: PRIMARY_GRADIENT } : undefined
                }
                className={cn(
                  "inline-flex h-10 min-w-[100px] items-center justify-center rounded-[8px] px-5 text-[14px] font-semibold transition-[filter,opacity] duration-200",
                  canSubmit
                    ? "text-white hover:brightness-105"
                    : "cursor-not-allowed bg-[rgba(96,109,118,0.1)] text-[#606d76]/50",
                )}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  primaryLabel
                )}
              </button>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
