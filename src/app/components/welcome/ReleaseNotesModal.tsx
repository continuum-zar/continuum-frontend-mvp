"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogOverlay, DialogPortal } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { welcomeModalAssets as a } from "./welcomeModalAssets";

const modalShadow =
  "shadow-[0px_135px_38px_0px_rgba(21,21,21,0),0px_86px_35px_0px_rgba(21,21,21,0.01),0px_49px_29px_0px_rgba(21,21,21,0.04),0px_22px_22px_0px_rgba(21,21,21,0.07),0px_5px_12px_0px_rgba(21,21,21,0.08)]";

/** Figma: `linear-gradient(0deg, #0B191F, #0B191F), linear-gradient(180deg, #B2E6F7 0%, #FDFBF7 100%)` */
const rightPanelBackground: CSSProperties = {
  backgroundColor: "#0B191F",
  backgroundImage: "linear-gradient(180deg, #B2E6F7 0%, #FDFBF7 100%)",
};

/** Figma: `linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(141.68deg, #24B5F8 -123.02%, #5521FE 802.55%)` */
const getStartedButtonBackground: CSSProperties = {
  backgroundImage:
    "linear-gradient(141.68deg, #24B5F8 -123.02%, #5521FE 802.55%), linear-gradient(0deg, #FFFFFF, #FFFFFF)",
};

export type ReleaseNotesModalMode = "welcome" | "release-notes";

export type ReleaseNotesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Welcome vs. release notes: small typography / layout tweaks */
  mode?: ReleaseNotesModalMode;
  /** Screen reader dialog title */
  ariaTitle: string;
  /** Screen reader dialog description */
  ariaDescription: string;
  /** Main heading in the left column */
  title: ReactNode;
  /** Body copy below the title */
  description: ReactNode;
  checklistItems: string[];
  /** Optional line below the checklist (e.g. early-access note) */
  footnote?: ReactNode;
  primaryButtonLabel: string;
  /** Optional badge on the illustration panel */
  rightPanelBadge?: string | null;
  /** Runs before the primary button closes the dialog (e.g. persist “seen”). */
  onPrimaryClick?: () => void | Promise<void>;
};

/**
 * Reusable two-column modal for welcome messaging or “What’s new” / release notes.
 * Figma reference (welcome): file 85TFw1LCFTEYQZR3NCEu0x (e.g. 43:10495 / 49:10715).
 */
export function ReleaseNotesModal({
  open,
  onOpenChange,
  mode = "welcome",
  ariaTitle,
  ariaDescription,
  title,
  description,
  checklistItems,
  footnote,
  primaryButtonLabel,
  rightPanelBadge,
  onPrimaryClick,
}: ReleaseNotesModalProps) {
  const dismiss = () => onOpenChange(false);
  const handlePrimary = async () => {
    await onPrimaryClick?.();
    dismiss();
  };
  const isReleaseNotes = mode === "release-notes";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[100] bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[101] max-h-[min(90vh,calc(100dvh-2rem))] w-[min(763px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] border-0 bg-transparent p-0 outline-none",
            modalShadow,
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={dismiss}
        >
          <DialogPrimitive.Title className="sr-only">{ariaTitle}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{ariaDescription}</DialogPrimitive.Description>

          <div className="relative flex max-h-[min(90vh,calc(100dvh-2rem))] w-full flex-col items-stretch overflow-hidden overflow-y-auto rounded-[16px] bg-white md:max-h-[min(90vh,calc(100dvh-2rem))] md:flex-row md:overflow-hidden">
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-4 right-4 z-[200] flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-white p-0 shadow-[0px_2px_8px_rgba(11,25,31,0.12)] outline-none ring-1 ring-[#ededed] hover:opacity-90"
              aria-label="Close"
            >
              <X className="size-[18px] shrink-0 text-[#0B191F]" strokeWidth={2} aria-hidden />
            </button>

            <div className="flex w-full shrink-0 flex-col gap-8 border-[#ededed] px-8 py-12 sm:px-10 sm:py-14 md:w-[408px] md:border-r md:border-solid">
              <div className="flex min-w-0 flex-col gap-5">
                <div className="flex min-w-0 flex-col gap-5">
                  <div
                    className={cn(
                      "w-full leading-[1.04]",
                      isReleaseNotes
                        ? "text-[clamp(26px,3.6vw,32px)] tracking-[-0.02em]"
                        : "text-[clamp(28px,4vw,36px)]",
                    )}
                  >
                    {title}
                  </div>
                  <div
                    className={cn(
                      "font-['Inter',sans-serif] text-[16px] font-normal leading-[1.618] tracking-[-0.48px] text-[rgba(21,21,21,0.79)]",
                      isReleaseNotes && "text-[15px] leading-[1.65] text-[rgba(21,21,21,0.82)]",
                    )}
                  >
                    {description}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col">
                  {checklistItems.map((item, index) => (
                    <div key={`${index}-${item}`} className="flex w-full items-start gap-2 rounded-[8px] py-2">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center text-[#24B5F8]",
                          isReleaseNotes && "text-[#5521FE]",
                        )}
                        aria-hidden
                      >
                        <Check className="size-4" strokeWidth={2.5} />
                      </span>
                      <p className="min-w-0 flex-1 font-['Inter',sans-serif] text-[16px] font-medium leading-normal text-[#151515]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
                {footnote ? (
                  <p className="w-full font-['Inter',sans-serif] text-[12px] font-normal leading-normal tracking-[-0.36px] text-[rgba(21,21,21,0.5)]">
                    {footnote}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handlePrimary()}
                className="box-border inline-flex h-8 w-[107px] shrink-0 items-center justify-center gap-[6px] rounded-[8px] border border-[rgba(255,255,255,0.1)] px-4 font-['Satoshi',sans-serif] text-[14px] font-bold leading-none text-white shadow-[0px_12px_3px_0px_rgba(45,154,249,0),0px_8px_3px_0px_rgba(45,154,249,0.03),0px_4px_3px_0px_rgba(45,154,249,0.11),0px_2px_2px_0px_rgba(45,154,249,0.19),0px_0px_1px_0px_rgba(45,154,249,0.21)]"
                style={getStartedButtonBackground}
              >
                {primaryButtonLabel}
              </button>
            </div>

            <div
              className="relative min-h-[280px] min-w-0 flex-1 overflow-hidden sm:min-h-[360px]"
              style={rightPanelBackground}
            >
              <CollageStack offsetClass="left-[calc(50%+185.91px)] top-[calc(50%-124.1px)]" />
              <CollageStack offsetClass="left-[calc(50%-169.09px)] top-[calc(50%+152.9px)]" />

              {rightPanelBadge ? (
                <div className="absolute top-[26px] left-4 z-10 flex items-center justify-center gap-[9px] rounded-[12px] border-[0.535px] border-solid border-[#ededed] bg-[rgba(255,255,255,0.98)] px-[15px] py-[4px]">
                  <p className="whitespace-nowrap font-['Satoshi',sans-serif] text-[9px] font-medium text-[#0b191f]">
                    {rightPanelBadge}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function CollageStack({ offsetClass }: { offsetClass: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute h-[320.802px] w-[858.822px] -translate-x-1/2 -translate-y-1/2",
        offsetClass,
      )}
    >
      <div className="-translate-x-1/2 absolute top-[-4.94px] left-[calc(50%+0.21px)] h-[350.949px] w-[629.24px] mix-blend-color-burn">
        <div className="absolute inset-[-91.26%_-50.9%]">
          <img alt="" className="block size-full max-w-none" src={a.frameCollage} />
        </div>
      </div>
      <div className="absolute top-[52.68px] left-[66.93px] flex h-[228.259px] w-[236.936px] items-center justify-center">
        <div className="flex-none -rotate-[5.98deg]">
          <div className="relative h-[206.825px] w-[216.57px] rounded-[5px] border-[0.553px] border-solid border-[#ededed] shadow-[0px_63.6px_17.7px_0px_rgba(26,59,84,0),0px_40.9px_16px_0px_rgba(26,59,84,0.01),0px_22.7px_13.8px_0px_rgba(26,59,84,0.05),0px_9.95px_9.95px_0px_rgba(26,59,84,0.09),0px_2.77px_5.53px_0px_rgba(26,59,84,0.1)]">
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[5px]">
              <div
                className="absolute inset-0 rounded-[5px]"
                style={{
                  backgroundImage:
                    "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
                }}
              />
              <img alt="" className="absolute size-full max-w-none rounded-[5px] object-cover" src={a.wip} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-[57.97px] left-[559.55px] flex h-[228.264px] w-[236.94px] items-center justify-center">
        <div className="flex-none rotate-[5.98deg]">
          <div className="relative h-[206.827px] w-[216.571px] rounded-[2.833px] border-[0.553px] border-solid border-[#ededed] shadow-[0px_63.6px_17.7px_0px_rgba(26,59,84,0),0px_40.9px_16px_0px_rgba(26,59,84,0.01),0px_22.7px_13.8px_0px_rgba(26,59,84,0.05),0px_9.95px_9.95px_0px_rgba(26,59,84,0.09),0px_2.77px_5.53px_0px_rgba(26,59,84,0.1)]">
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.833px]">
              <div
                className="absolute inset-0 rounded-[2.833px]"
                style={{
                  backgroundImage:
                    "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
                }}
              />
              <img alt="" className="absolute size-full max-w-none rounded-[2.833px] object-cover" src={a.wip1} />
            </div>
          </div>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute top-[12.79px] left-[calc(50%+0.2px)] h-[263.829px] w-[406.222px] rounded-[3.856px] border-[0.705px] border-solid border-[#ededed] shadow-[0px_153px_43px_0px_rgba(26,59,84,0),0px_98.2px_39.4px_0px_rgba(26,59,84,0.01),0px_55.2px_33.2px_0px_rgba(26,59,84,0.04),0px_24.55px_24.55px_0px_rgba(26,59,84,0.07),0px_6.14px_13.3px_0px_rgba(26,59,84,0.08)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[3.856px]">
          <div
            className="absolute inset-0 rounded-[3.856px]"
            style={{
              backgroundImage:
                "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
            }}
          />
          <img alt="" className="absolute size-full max-w-none rounded-[3.856px] object-cover" src={a.wip2} />
        </div>
      </div>
    </div>
  );
}
