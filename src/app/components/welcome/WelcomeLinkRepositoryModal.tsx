"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { GitHubInstallationRepoLinker } from "../dashboard-placeholder/GitHubInstallationRepoLinker";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "../ui/dialog";
import { cn } from "../ui/utils";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

/** Figma playground node 21:9969 / 21:9971 / 21:10007 — asset URLs from design context */
const imgLucideArrowLeft = mcpAsset("87d62a9b-f825-4e11-bc9a-d08105d1800e");
const imgLucideX = mcpAsset("25ba1811-ddb0-4b13-83b1-420f5ba868f2");

type WelcomeLinkRepositoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, linking uses POST /projects/:id/repositories for this project */
  projectId?: number;
};

export function WelcomeLinkRepositoryModal({
  open,
  onOpenChange,
  projectId,
}: WelcomeLinkRepositoryModalProps) {
  const canUseApi = projectId != null && Number.isFinite(projectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(90vh,860px)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Link repository</DialogPrimitive.Title>

          {/* Header — Figma 21:9971 */}
          <div className="relative z-[3] flex w-full shrink-0 items-center justify-between border-b border-solid border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                aria-label="Back"
              >
                <span className="relative block size-5">
                  <img alt="" className="block size-full max-w-none" src={imgLucideArrowLeft} />
                </span>
              </button>
            </DialogClose>
            <div className="pointer-events-none absolute left-1/2 top-[25px] flex -translate-x-1/2 flex-col items-center gap-3">
              <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Link repositry
              </p>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-[27px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0"
                aria-label="Close"
              >
                <span className="relative block size-4">
                  <img alt="" className="absolute block size-full max-w-none" src={imgLucideX} />
                </span>
              </button>
            </DialogClose>
          </div>

          {/* Body — Figma 21:10007 */}
          <div
            className="z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            {!canUseApi ? (
              <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">
                A project is required before you can link a repository.
              </p>
            ) : (
              <GitHubInstallationRepoLinker
                projectId={projectId!}
                queryEnabled={open}
                onRepoLinked={() => onOpenChange(false)}
                githubOAuthReturnHints={{
                  reopenSettings: false,
                  reopenGithubIntegrationModal: false,
                  reopenWelcomeLinkRepoModal: true,
                }}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
