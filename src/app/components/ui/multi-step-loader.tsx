"use client";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "./utils";

/**
 * Aceternity-style "multi-step loader", adapted for Continuum.
 *
 * Instead of cycling through a fixed list of strings on a timer, this variant is
 * driven by real steps streamed from the agent. Each step has a state so the
 * latest one spins, completed ones get a (Continuum-blue/green) check, and a
 * failed one turns red. Older steps scroll up and fade behind a radial mask so
 * the view stays focused on what the agent is doing *right now*.
 */

export type LoaderStepState = "done" | "active" | "error";

export interface LoaderStep {
  /** Stable react key. */
  id: string;
  /** Human-readable description of what the agent is doing. */
  text: string;
  state: LoaderStepState;
}

/** How many trailing steps to keep mounted in the live (animated) view. */
const LIVE_WINDOW = 10;

function CheckFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-5 animate-spin", className)}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-20"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm10.28-4.28a.75.75 0 0 0-1.06 0L9 9.94 6.53 7.72a.75.75 0 0 0-1.06 1.06L7.94 12l-2.47 2.47a.75.75 0 1 0 1.06 1.06L12 14.06l2.47 2.47a.75.75 0 1 0 1.06-1.06L13.06 12l2.47-2.47a.75.75 0 0 0 0-1.06L12.53 7.72Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StepIcon({ state }: { state: LoaderStepState }) {
  if (state === "error") {
    return <ErrorIcon className="text-[var(--destructive)]" />;
  }
  if (state === "active") {
    return <SpinnerIcon className="text-[var(--primary)]" />;
  }
  return <CheckFilledIcon className="text-[var(--success)]" />;
}

/**
 * A single step row. Shared between the live loader and the static (terminal)
 * checklist so they always look identical.
 */
export function StepRow({
  step,
  dimmed = false,
}: {
  step: LoaderStep;
  dimmed?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 text-left">
      <span className="mt-0.5 shrink-0">
        <StepIcon state={step.state} />
      </span>
      <span
        className={cn(
          "text-[14px] leading-snug",
          step.state === "active"
            ? "font-medium text-foreground"
            : step.state === "error"
              ? "text-[var(--destructive)]"
              : dimmed
                ? "text-muted-foreground"
                : "text-foreground",
        )}
      >
        {step.text}
      </span>
    </div>
  );
}

/**
 * Live, animated multi-step loader. Renders the trailing window of steps centred
 * behind a radial mask; the newest step animates in at the bottom and older ones
 * fade upward.
 */
export function MultiStepLoader({
  steps,
  className,
}: {
  steps: LoaderStep[];
  className?: string;
}) {
  const window = steps.slice(-LIVE_WINDOW);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div className="absolute inset-0 z-10 flex items-end justify-center pb-[42%]">
        <div className="flex w-full max-w-md flex-col gap-5 px-10">
          <AnimatePresence initial={false}>
            {window.map((step, index) => {
              // 0 == newest (bottom). Older steps fade toward the top.
              const fromEnd = window.length - 1 - index;
              const opacity =
                step.state === "active" ? 1 : Math.max(1 - fromEnd * 0.22, 0.12);
              return (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <StepRow step={step} dimmed={fromEnd > 0} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Radial mask: clear in the centre, fades to the page background at the
          top/bottom edges so the stream looks like it's flowing through. */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-background [mask-image:radial-gradient(420px_circle_at_center,transparent_25%,black_85%)]" />
    </div>
  );
}

/**
 * Static checklist of every step, for terminal runs. Plain scrollable list (no
 * mask / animation) so the user can scroll back through everything the agent did.
 */
export function StepChecklist({ steps }: { steps: LoaderStep[] }) {
  return (
    <ol className="flex flex-col gap-3.5">
      {steps.map((step) => (
        <li key={step.id}>
          <StepRow step={step} dimmed={step.state === "done"} />
        </li>
      ))}
    </ol>
  );
}
