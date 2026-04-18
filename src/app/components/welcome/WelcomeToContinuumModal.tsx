"use client";

import type { ReleaseNotesModalProps } from "./ReleaseNotesModal";
import { ReleaseNotesModal } from "./ReleaseNotesModal";

function WelcomeContinuumTitle() {
  return (
    <>
      <span className="font-['Satoshi',sans-serif] font-medium text-[#0b191f]">Welcome to </span>
      <span
        className="font-sarina bg-clip-text font-normal text-transparent"
        style={{
          backgroundImage: "linear-gradient(125.28deg, rgb(36, 181, 248) 4.62%, rgb(85, 33, 254) 148.53%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        Continuum
      </span>
    </>
  );
}

/** Static props for the post-onboarding welcome modal (excluding `open` / `onOpenChange`). */
export const welcomeToContinuumModalProps: Omit<ReleaseNotesModalProps, "open" | "onOpenChange"> = {
  mode: "welcome",
  ariaTitle: "Welcome to Continuum",
  ariaDescription:
    "You are officially off the waitlist. Continuum is designed to cut through the operational noise.",
  title: <WelcomeContinuumTitle />,
  description: (
    <>
      You are officially off the waitlist. Continuum is designed to cut through the operational noise, protecting your
      team&apos;s flow state while giving you absolute project clarity.
    </>
  ),
  checklistItems: [
    "Use the timer to log work without administrative friction.",
    "Sprints roll up into clear, actionable data for stakeholders.",
  ],
  footnote:
    "As an early-access user, your input directly shapes our roadmap. We will reach out in a few weeks to hear your thoughts.",
  primaryButtonLabel: "Get Started",
  rightPanelBadge: "Coming soon",
};

type WelcomeToContinuumModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * First-time post-onboarding welcome (“Get started” board).
 * Prefer importing {@link ReleaseNotesModal} with {@link welcomeToContinuumModalProps} for new code.
 */
export function WelcomeToContinuumModal({ open, onOpenChange }: WelcomeToContinuumModalProps) {
  return <ReleaseNotesModal {...welcomeToContinuumModalProps} open={open} onOpenChange={onOpenChange} />;
}
