"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "../ui/dialog";
import { cn } from "../ui/utils";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

/** Figma playground node 21:9969 / 21:9971 / 21:10007 — asset URLs from design context */
const imgLucideArrowLeft =
  mcpAsset("87d62a9b-f825-4e11-bc9a-d08105d1800e");
const imgLucideX = mcpAsset("25ba1811-ddb0-4b13-83b1-420f5ba868f2");
const imgLucideCalendar =
  mcpAsset("3ce919d3-754a-4f0f-849a-28d0113aa5c0");
const imgLucideChevronDown =
  mcpAsset("e4587061-0e2f-4576-85e6-65765188c9d2");
const imgLucideInfo =
  mcpAsset("6b39c1ca-6d99-4835-9a9f-23dd7ffc6211");

const primaryButtonGradient =
  "linear-gradient(166.56145949751235deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)";

const inputClass =
  "w-full rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-3 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#606d76] focus-visible:ring-2 focus-visible:ring-[#24b5f8]/40";

type WelcomeLinkRepositoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WelcomeLinkRepositoryModal({ open, onOpenChange }: WelcomeLinkRepositoryModalProps) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryName, setRepositoryName] = useState("");
  const [provider, setProvider] = useState("github");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [apiToken, setApiToken] = useState("");

  useEffect(() => {
    if (!open) return;
    setRepositoryUrl("");
    setRepositoryName("");
    setProvider("github");
    setWebhookSecret("");
    setApiToken("");
  }, [open]);

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
            <div className="flex w-full flex-col gap-6">
              <div className="flex w-full flex-col gap-4">
                <div className="flex h-[69px] w-full flex-col gap-1">
                  <p className="shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                    Repository URL
                  </p>
                  <div className="relative w-full shrink-0">
                    <input
                      type="url"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                      placeholder="https://github.com/org/repo"
                      className={cn(inputClass, "pr-12")}
                      autoComplete="url"
                    />
                    <div
                      className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
                      aria-hidden
                    >
                      <img alt="" className="absolute block size-full max-w-none" src={imgLucideCalendar} />
                    </div>
                  </div>
                </div>

                <div className="flex h-[69px] w-full flex-col gap-1">
                  <p className="shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                    Repository name
                  </p>
                  <input
                    type="text"
                    value={repositoryName}
                    onChange={(e) => setRepositoryName(e.target.value)}
                    placeholder="Org/repo"
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>

                <div className="flex w-full flex-col gap-1">
                  <p className="shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                    Provider
                  </p>
                  <div className="relative w-full">
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className={cn(inputClass, "cursor-pointer appearance-none pr-12 text-[#0b191f]")}
                      aria-label="Provider"
                    >
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                      <option value="bitbucket">Bitbucket</option>
                    </select>
                    <div className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" aria-hidden>
                      <img alt="" className="absolute block size-full max-w-none" src={imgLucideChevronDown} />
                    </div>
                  </div>
                </div>

                <div className="flex h-[69px] w-full flex-col gap-1">
                  <p className="shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                    Web-hook secret (optional)
                  </p>
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Secret from GitHub/GitLab/BitBucket web-hook"
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>

                <div className="flex h-[69px] w-full flex-col gap-1">
                  <p className="shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                    API token (optional, for private repos/scanning)
                  </p>
                  <input
                    type="text"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Personal access token"
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex w-full gap-2">
                <div className="relative mt-0.5 size-4 shrink-0">
                  <img alt="" className="absolute block size-full max-w-none" src={imgLucideInfo} />
                </div>
                <p className="min-w-0 flex-1 whitespace-pre-wrap font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">
                  {`After  linking, add a webh-hook in your repo settings pointing to this app with the same URL and secret.`}
                </p>
              </div>

              <div className="flex h-[39px] w-full items-center justify-end">
                <button
                  type="button"
                  className="inline-flex h-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 px-4 py-2.5 font-['Satoshi',sans-serif] text-[14px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#24b5f8]/50"
                  style={{ backgroundImage: primaryButtonGradient }}
                  onClick={() => onOpenChange(false)}
                >
                  Link repository
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
