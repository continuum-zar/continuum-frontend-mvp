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

/** Figma playground 21:10053 / 21:10055 / 21:10072 / 21:10202 / 21:10152 */
const imgLucideArrowLeft =
  mcpAsset("988dda97-4902-4371-bc4c-9ffe4afea0e8");
const imgLucideX = mcpAsset("2c079b92-8097-4df4-8a11-e1f18dba0f5a");
const imgLucideCalendar =
  mcpAsset("b6c3dbcc-8336-401f-a031-737097b8b021");
const imgLucideChevronDown =
  mcpAsset("e35c7a9b-edbf-490f-911a-a2c7f3582268");
const imgLucideLink =
  mcpAsset("c71c30bb-4db7-47ac-8e4f-ea6fc97b4fb8");

const inviteButtonGradient =
  "linear-gradient(151.86872497935377deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)";

const copyLinkTextGradient =
  "linear-gradient(165.94870676317367deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(11, 25, 31) 0%, rgb(11, 25, 31) 100%)";

const inputShellClass =
  "w-full rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-3 font-['Satoshi',sans-serif] text-[16px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#24b5f8]/40";

const MEMBER_ROWS = [
  {
    initials: "A",
    primary: "amushiringani@gmail.com",
    secondary: "Pending",
    role: "Project Manager",
  },
  {
    initials: "JH",
    primary: "Amukelani Shiringani",
    secondary: "amushiringani@gmail.com",
    role: "Project Manager",
  },
  {
    initials: "MK",
    primary: "Mandla Khumalo",
    secondary: "mandlak@growthhub.com",
    role: "Lead Developer",
  },
  {
    initials: "SN",
    primary: "Sipho Ndlovu",
    secondary: "sipho.ndlovu@creativeco.co.za",
    role: "UX Designer",
  },
] as const;

const ROLE_OPTIONS = ["Project Manager", "Lead Developer", "UX Designer", "Developer"] as const;

type WelcomeShareProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WelcomeShareProjectModal({ open, onOpenChange }: WelcomeShareProjectModalProps) {
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [memberRoles, setMemberRoles] = useState<string[]>(() => MEMBER_ROWS.map((r) => r.role));

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setInviteRole("developer");
    setMemberRoles(MEMBER_ROWS.map((r) => r.role));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(92vh,900px)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Share this project</DialogPrimitive.Title>

          {/* Header — Figma 21:10055 */}
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
                Share this project
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

          {/* Body — Figma 21:10072 */}
          <div
            className="z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <div className="flex w-full flex-col gap-6 pb-6">
              <div className="flex w-full flex-col gap-6">
                {/* Invite row */}
                <div className="flex w-full min-w-0 items-stretch justify-center gap-4">
                  <div className="relative min-h-0 min-w-0 flex-1">
                    <div className="relative w-full">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className={cn(inputShellClass, "pr-12 placeholder:text-[#606d76]")}
                        autoComplete="email"
                      />
                      <div
                        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
                        aria-hidden
                      >
                        <img alt="" className="absolute block size-full max-w-none" src={imgLucideCalendar} />
                      </div>
                    </div>
                  </div>
                  <div className="relative min-h-0 min-w-0 flex-1">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className={cn(
                        inputShellClass,
                        "cursor-pointer appearance-none pr-12 text-[#0b191f]",
                      )}
                      aria-label="Role for invitation"
                    >
                      <option value="developer">Developer</option>
                      <option value="designer">Designer</option>
                      <option value="pm">Project Manager</option>
                    </select>
                    <div className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" aria-hidden>
                      <img alt="" className="absolute block size-full max-w-none" src={imgLucideChevronDown} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex min-w-[88px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 px-4 py-2.5 font-['Satoshi',sans-serif] text-[14px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#24b5f8]/50"
                    style={{ backgroundImage: inviteButtonGradient }}
                  >
                    Invite
                  </button>
                </div>

                {/* Who has access — Figma 21:10107–21:10151 */}
                <div className="flex w-full flex-col gap-4">
                  <div className="flex w-full items-center justify-between">
                    <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Who has access
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-4">
                    {MEMBER_ROWS.map((row, i) => (
                      <div
                        key={`${row.initials}-${row.primary}`}
                        className="flex w-full items-center gap-2 overflow-hidden pr-2 rounded-[8px]"
                      >
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-[999px] border-[1.333px] border-solid border-white bg-[#e19c02]"
                          aria-hidden
                        >
                          <span className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-[0.4] text-white">
                            {row.initials}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center px-2 py-1.5">
                          <p className="w-full font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                            {row.primary}
                          </p>
                          <p className="w-full font-['Satoshi',sans-serif] text-[12px] font-medium text-[#727d83]">
                            {row.secondary}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0">
                          <select
                            value={memberRoles[i]}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMemberRoles((prev) => {
                                const next = [...prev];
                                next[i] = v;
                                return next;
                              });
                            }}
                            className={cn(
                              "cursor-pointer appearance-none rounded-[16px] border-0 bg-[#f0f3f5] px-3 py-1 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76] outline-none focus-visible:ring-2 focus-visible:ring-[#24b5f8]/40",
                            )}
                            aria-label={`Role for ${row.primary}`}
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <div className="relative shrink-0 size-4" aria-hidden>
                            <img alt="" className="absolute block size-full max-w-none" src={imgLucideChevronDown} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer — Figma 21:10201 / 21:10202 */}
          <div className="z-[1] flex w-full shrink-0 items-center justify-end border-t border-solid border-[#ebedee] bg-white px-9 py-4">
            <div className="flex w-full max-w-[528px] items-center justify-end">
              <button
                type="button"
                className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-white px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#24b5f8]/50"
                onClick={() => {
                  void navigator.clipboard?.writeText(`${window.location.origin}/dashboard-placeholder/welcome`);
                }}
              >
                <span className="relative block size-4 shrink-0">
                  <img alt="" className="absolute block size-full max-w-none" src={imgLucideLink} />
                </span>
                <span
                  className="bg-clip-text font-['Satoshi',sans-serif] text-[14px] font-medium text-transparent"
                  style={{ backgroundImage: copyLinkTextGradient }}
                >
                  Copy link
                </span>
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
