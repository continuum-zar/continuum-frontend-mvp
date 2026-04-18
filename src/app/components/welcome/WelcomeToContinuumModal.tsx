"use client";

import { ReleaseNotesModal } from "./ReleaseNotesModal";
import { welcomeToContinuumModalProps } from "./welcomeToContinuumModalProps";

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
