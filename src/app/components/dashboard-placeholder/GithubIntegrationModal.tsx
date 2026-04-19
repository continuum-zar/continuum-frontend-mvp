"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Check, Github, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { getGitHubOAuthAuthorizeLocation } from "@/api/githubApp";
import { getApiErrorMessage, useGithubInstallationRepositories, useProjects } from "@/api/hooks";

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

type GithubIntegrationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GithubIntegrationModal({ open, onOpenChange }: GithubIntegrationModalProps) {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [projectApiId, setProjectApiId] = useState<number | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);

  const reposQuery = useGithubInstallationRepositories(projectApiId, open);

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

  const handleClose = (next: boolean) => {
    if (!next) {
      setConnectBusy(false);
    }
    onOpenChange(next);
  };

  const handleConnect = async () => {
    if (projectApiId == null) return;
    setConnectBusy(true);
    try {
      const url = await getGitHubOAuthAuthorizeLocation(projectApiId);
      window.location.assign(url);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not start GitHub connection"));
      setConnectBusy(false);
    }
  };

  const axiosStatus = isAxiosError(reposQuery.error) ? reposQuery.error.response?.status : undefined;
  const notConnected = axiosStatus === 404;
  const forbidden = axiosStatus === 403;
  const serviceUnavailable = axiosStatus === 503;
  const connected = reposQuery.isSuccess;

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
                <p className="text-[14px] leading-relaxed text-[#606d76]">
                  Link the GitHub App to a Continuum project. After you authorize on GitHub, we show repositories
                  available to that installation.
                </p>

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

                <div className="flex flex-col gap-2 rounded-[8px] border border-[#e9e9e9] bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Github className="size-5 shrink-0 text-[#0b191f]" strokeWidth={1.5} aria-hidden />
                    <p className="text-[15px] font-semibold text-[#0b191f]">Connection</p>
                  </div>
                  {reposQuery.isLoading ? (
                    <p className="flex items-center gap-2 text-[14px] text-[#606d76]">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Checking status…
                    </p>
                  ) : reposQuery.isError ? (
                    <>
                      {notConnected ? (
                        <p className="text-[14px] text-[#606d76]">
                          Not connected yet. Use <span className="font-medium text-[#0b191f]">Connect to GitHub</span>{" "}
                          to authorize the app for this project.
                        </p>
                      ) : forbidden ? (
                        <p className="text-[14px] text-[#0b191f]">
                          You don&apos;t have access to this project&apos;s GitHub data. Ask a project admin to connect
                          or grant access.
                        </p>
                      ) : serviceUnavailable ? (
                        <p className="text-[14px] text-[#0b191f]">
                          GitHub App integration isn&apos;t configured on the server (missing app credentials).
                        </p>
                      ) : (
                        <p className="text-[14px] text-[#0b191f]">
                          {getApiErrorMessage(reposQuery.error, "Could not load GitHub status.")}
                        </p>
                      )}
                    </>
                  ) : connected ? (
                    <p className="flex items-center gap-2 text-[14px] font-medium text-[#0b191f]">
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#22c55e]">
                        <Check className="size-3.5 text-white" strokeWidth={2.5} aria-hidden />
                      </span>
                      Connected — {reposQuery.data?.length ?? 0} repo
                      {(reposQuery.data?.length ?? 0) === 1 ? "" : "s"} visible to the installation
                    </p>
                  ) : null}
                </div>

                {connected && (reposQuery.data?.length ?? 0) > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[13px] font-semibold text-[#252014]">Repositories</p>
                    <ul className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
                      {reposQuery.data!.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-[6px] border border-[#f0f0f0] bg-[#fafafa] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#0b191f]"
                        >
                          <span className="font-medium">{r.owner.login}</span>
                          <span className="text-[#606d76]"> / </span>
                          <span>{r.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {connected && reposQuery.data?.length === 0 ? (
                  <p className="text-[13px] text-[#606d76]">
                    Installation is linked, but no repositories were returned yet. Confirm the GitHub App is installed on
                    your org or account with repository access.
                  </p>
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
            {projects.length > 0 && projectApiId != null ? (
              <button
                type="button"
                onClick={() => void handleConnect()}
                disabled={connectBusy}
                style={!connectBusy ? { background: PRIMARY_GRADIENT } : undefined}
                className={cn(
                  "inline-flex h-10 min-w-[140px] items-center justify-center rounded-[8px] px-5 text-[14px] font-semibold transition-[filter,opacity] duration-200",
                  connectBusy
                    ? "cursor-not-allowed bg-[rgba(96,109,118,0.1)] text-[#606d76]/50"
                    : "text-white hover:brightness-105",
                )}
              >
                {connectBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Connect to GitHub"
                )}
              </button>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
