"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useProjects } from "@/api/hooks";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";
import { GitHubInstallationRepoLinker } from "./GitHubInstallationRepoLinker";

type GithubIntegrationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** After GitHub OAuth, pre-select this Continuum project once projects are loaded. */
  oauthResumeProjectApiId?: number | null;
  onOAuthResumeProjectApplied?: () => void;
};

export function GithubIntegrationModal({
  open,
  onOpenChange,
  oauthResumeProjectApiId = null,
  onOAuthResumeProjectApplied,
}: GithubIntegrationModalProps) {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [projectApiId, setProjectApiId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (projects.length === 0) {
      setProjectApiId(null);
      return;
    }
    setProjectApiId((prev) => {
      if (prev != null && projects.some((p) => p.apiId === prev)) return prev;
      return projects[0]!.apiId;
    });
  }, [open, projects]);

  useEffect(() => {
    if (!open || oauthResumeProjectApiId == null || !Number.isFinite(oauthResumeProjectApiId)) return;
    if (projectsLoading || projects.length === 0) return;
    const id = oauthResumeProjectApiId;
    if (!projects.some((p) => p.apiId === id)) {
      onOAuthResumeProjectApplied?.();
      return;
    }
    setProjectApiId(id);
    onOAuthResumeProjectApplied?.();
  }, [open, projects, projectsLoading, oauthResumeProjectApiId, onOAuthResumeProjectApplied]);

  const handleClose = (next: boolean) => {
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white font-['Satoshi',sans-serif] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">GitHub integration</DialogPrimitive.Title>

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
            <p className="text-center text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              GitHub integration
            </p>
            <div className="size-5" aria-hidden />
          </div>

          <div
            className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            {projectsLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-[#606d76]">
                <Loader2 className="size-5 animate-spin text-[#606d76]" />
                Loading…
              </div>
            ) : projects.length === 0 ? (
              <p className="text-left text-[15px] leading-relaxed text-[#606d76]">
                Create a project first, then connect GitHub so Continuum can list repositories from your installation.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label htmlFor="github-project" className="text-[14px] font-medium text-[#606d76]">
                    Continuum project
                  </label>
                  <Select
                    value={projectApiId != null ? String(projectApiId) : undefined}
                    onValueChange={(v) => setProjectApiId(Number(v))}
                  >
                    <SelectTrigger
                      id="github-project"
                      className={cn(
                        "h-10 w-full rounded-[8px] border border-[#e9e9e9] bg-white px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] shadow-none focus:ring-2 focus:ring-ring",
                        "[&_svg]:size-6 [&_svg]:opacity-100 [&_svg]:text-[#0b191f]",
                      )}
                    >
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="z-[200] font-['Satoshi',sans-serif]">
                      {projects.map((p) => (
                        <SelectItem key={p.apiId} value={String(p.apiId)} className="text-[16px] font-medium">
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {projectApiId != null ? (
                  <GitHubInstallationRepoLinker projectId={projectApiId} queryEnabled={open} />
                ) : null}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#e5e7eb] bg-[#f9f9f9] px-9 py-4 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 text-[14px] font-semibold text-[#252014] transition-colors hover:bg-[#f5f7f8]"
              >
                Close
              </button>
            </DialogClose>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
