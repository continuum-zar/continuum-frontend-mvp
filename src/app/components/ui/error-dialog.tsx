"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Clock,
  Lock,
  RefreshCw,
  SearchX,
  ServerCrash,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "./dialog";
import { cn } from "./utils";

/**
 * Unified error dialog. Surfaces application errors (404, 403, 5xx, network
 * failures, …) using the exact modal chrome shared across Continuum — see
 * CreateProjectModal / GithubIntegrationModal / DiscordIntegrationModal:
 *
 *   - rounded-[16px] white card, border #f5f5f5, the layered modal shadow
 *   - header: grid [20px 1fr 20px] on #f9f9f9, ArrowLeft close · centered
 *     title · spacer; optional muted inline icon before the title
 *   - body: px-9 py-6 over the subtle white→#f9f9f9 gradient, muted copy
 *   - footer: border-t #e5e7eb on #f9f9f9, text-only buttons — primary blue
 *     #2798f5 (matches the Log Time action), secondary outline
 *
 * Use the presets in {@link ERROR_DIALOG_PRESETS} for the common codes, or
 * compose your own via the props directly.
 */

export type ErrorDialogAction = {
  label: string;
  onClick?: () => void;
  /** Visual weight. Defaults: primary = blue, secondary = outline. */
  variant?: "primary" | "secondary";
  /** Show a spinner + disable (in-flight retry, sign-in, …). */
  loading?: boolean;
  disabled?: boolean;
};

export type ErrorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. 404, 500 — shown as a muted "Error 404" line above the message. */
  code?: string | number;
  title: string;
  description?: React.ReactNode;
  /** Optional muted lucide icon rendered inline before the title. */
  icon?: LucideIcon;
  /** Right-most / emphasised action (blue). */
  primaryAction?: ErrorDialogAction;
  /** Left action (outline). */
  secondaryAction?: ErrorDialogAction;
  /** Support reference id, rendered as a muted field-style row. */
  correlationId?: string;
  /** Raw technical message, shown in a collapsible <details>. */
  technicalDetails?: string;
  /** Hide the top-left close (ArrowLeft) affordance. */
  hideClose?: boolean;
  /** When false, clicking the overlay / pressing Esc will not close. */
  dismissible?: boolean;
};

const MODAL_SHADOW =
  "shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]";

const BODY_GRADIENT =
  "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)";

function ActionButton({
  action,
  defaultVariant,
}: {
  action: ErrorDialogAction;
  defaultVariant: "primary" | "secondary";
}) {
  const variant = action.variant ?? defaultVariant;
  const disabled = action.disabled || action.loading;
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 min-w-[100px] items-center justify-center gap-2 rounded-[8px] px-5 text-[14px] font-semibold transition-colors",
        variant === "primary"
          ? "bg-[#2798f5] text-white hover:bg-[#1e87e0] disabled:cursor-not-allowed disabled:bg-[rgba(96,109,118,0.1)] disabled:text-[#606d76]/50"
          : "border border-[#e9e9e9] bg-white text-[#252014] hover:bg-[#f5f7f8] disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {action.loading ? <RefreshCw className="size-4 animate-spin" aria-hidden /> : null}
      {action.label}
    </button>
  );
}

export function ErrorDialog({
  open,
  onOpenChange,
  code,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  correlationId,
  technicalDetails,
  hideClose = false,
  dismissible = true,
}: ErrorDialogProps) {
  const Icon = icon;
  const hasFooter = Boolean(primaryAction || secondaryAction);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[200] bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
          onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
          className={cn(
            "fixed top-1/2 left-1/2 z-[201] flex max-h-[min(90vh,560px)] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white font-['Satoshi',sans-serif] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            MODAL_SHADOW,
          )}
        >
          {/* Header — ArrowLeft close · centered title · spacer */}
          <div className="grid w-full shrink-0 grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            {hideClose ? (
              <div className="size-5" aria-hidden />
            ) : (
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center text-[#606d76]"
                  aria-label="Close"
                >
                  <ArrowLeft className="size-5" />
                </button>
              </DialogClose>
            )}
            <div className="flex items-center justify-center gap-2">
              {Icon ? <Icon className="size-5 shrink-0 text-[#606d76]" aria-hidden /> : null}
              <DialogPrimitive.Title className="text-center text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                {title}
              </DialogPrimitive.Title>
            </div>
            <div className="size-5" aria-hidden />
          </div>

          {/* Body */}
          <div
            className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-9 py-6"
            style={{ backgroundImage: BODY_GRADIENT }}
          >
            <div className="flex flex-col gap-3 text-left">
              {code != null ? (
                <p className="text-[13px] font-medium text-[#606d76]/60">Error {code}</p>
              ) : null}

              {description ? (
                <DialogPrimitive.Description className="text-[15px] leading-relaxed text-[#606d76]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}

              {correlationId ? (
                <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#e9e9e9] bg-white px-4 py-2.5">
                  <span className="text-[13px] font-medium text-[#606d76]">Error ID</span>
                  <code className="truncate font-mono text-[12px] text-[#0b191f]">
                    {correlationId}
                  </code>
                </div>
              ) : null}

              {technicalDetails ? (
                <details className="rounded-[8px] border border-[#e9e9e9] bg-white px-4 py-2.5">
                  <summary className="cursor-pointer list-none text-[13px] font-medium text-[#606d76] select-none">
                    Technical details
                  </summary>
                  <p className="mt-2 font-mono text-[12px] leading-[18px] break-words text-[#606d76]">
                    {technicalDetails}
                  </p>
                </details>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          {hasFooter ? (
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#e5e7eb] bg-[#f9f9f9] px-9 py-4 sm:flex-row sm:justify-end">
              {secondaryAction ? (
                <ActionButton action={secondaryAction} defaultVariant="secondary" />
              ) : null}
              {primaryAction ? (
                <ActionButton action={primaryAction} defaultVariant="primary" />
              ) : null}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Presets                                                            */
/* ------------------------------------------------------------------ */

export type ErrorDialogPreset = Pick<
  ErrorDialogProps,
  "code" | "title" | "description" | "icon"
>;

/**
 * Copy aligned with src/lib/errorMessages.ts so what users see here matches the
 * toast / inline copy elsewhere. Keyed by HTTP status or a transport label.
 */
export const ERROR_DIALOG_PRESETS = {
  notFound: {
    code: 404,
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
    icon: SearchX,
  },
  forbidden: {
    code: 403,
    title: "Access denied",
    description: "You don't have permission to perform this action.",
    icon: Lock,
  },
  unauthorized: {
    code: 401,
    title: "Session expired",
    description: "Your session has expired. Please sign in again.",
    icon: Lock,
  },
  paymentRequired: {
    code: 402,
    title: "Out of AI credits",
    description:
      "You've run out of AI credits. Your balance resets at the start of next month, or an admin can top you up.",
    icon: Ban,
  },
  conflict: {
    code: 409,
    title: "Update conflict",
    description:
      "This change conflicts with the current state. Refresh and try again.",
    icon: AlertTriangle,
  },
  validation: {
    code: 422,
    title: "Invalid information",
    description:
      "Some of the information provided is invalid. Please review and try again.",
    icon: AlertTriangle,
  },
  rateLimited: {
    code: 429,
    title: "Too many requests",
    description:
      "We're handling a lot of requests right now. Please wait a moment and try again.",
    icon: Clock,
  },
  serverError: {
    code: 500,
    title: "Something went wrong",
    description:
      "Something went wrong on our end. We've been notified and are looking into it.",
    icon: ServerCrash,
  },
  offline: {
    title: "You're offline",
    description:
      "You appear to be offline. Please check your internet connection and try again.",
    icon: WifiOff,
  },
  timeout: {
    code: 408,
    title: "This is taking too long",
    description:
      "This is taking longer than expected. Please check your connection and try again.",
    icon: Clock,
  },
  generic: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    icon: AlertTriangle,
  },
} satisfies Record<string, ErrorDialogPreset>;

export type ErrorDialogPresetKey = keyof typeof ERROR_DIALOG_PRESETS;

/** Common ready-made actions so callers don't re-declare them. */
export const errorDialogActions = {
  goHome: (onClick: () => void): ErrorDialogAction => ({
    label: "Go home",
    onClick,
    variant: "primary",
  }),
  goBack: (onClick: () => void): ErrorDialogAction => ({
    label: "Go back",
    onClick,
    variant: "secondary",
  }),
  retry: (onClick: () => void): ErrorDialogAction => ({
    label: "Try again",
    onClick,
    variant: "primary",
  }),
};
