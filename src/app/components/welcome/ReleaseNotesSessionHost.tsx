import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";

import {
  fetchLatestReleaseNote,
  markReleaseNoteSeen,
  releaseNoteKeys,
  type LatestReleaseNote,
} from "@/api/releaseNotes";
import { useAuthStore } from "@/store/authStore";

import { ReleaseNotesModal } from "./ReleaseNotesModal";
import {
  SESSION_POST_ONBOARDING_WELCOME_KEY,
  SESSION_SUPPRESS_RELEASE_NOTES_NEW_SIGNUP_KEY,
  welcomeModalDismissedKeyForUser,
} from "./welcomeModalAssets";

/**
 * After login, loads the latest release note and shows {@link ReleaseNotesModal} when the
 * backend reports it unseen. Waits until the post-onboarding welcome modal flow is finished
 * so the two modals do not stack.
 */
export function ReleaseNotesSessionHost() {
  const userId = useAuthStore((s) => s.user?.id);
  const location = useLocation();
  const queryClient = useQueryClient();
  const [pendingNote, setPendingNote] = useState<LatestReleaseNote | null>(null);

  const skipHost = location.pathname.startsWith("/onboarding");

  const { data: latestRelease } = useQuery({
    queryKey: releaseNoteKeys.latest(),
    queryFn: fetchLatestReleaseNote,
    enabled: Boolean(userId) && !skipHost,
    staleTime: 60_000,
  });

  const welcomePending =
    typeof window !== "undefined" &&
    userId != null &&
    sessionStorage.getItem(SESSION_POST_ONBOARDING_WELCOME_KEY) === "1" &&
    localStorage.getItem(welcomeModalDismissedKeyForUser(userId)) !== "1";

  /**
   * New signups go through welcome modal + tutorial; release notes must not appear
   * during that flow. We silently mark the latest note seen for them so it does not
   * pop up later in the same session — and they will never see this version on next login.
   */
  const suppressForNewSignup =
    typeof window !== "undefined" &&
    sessionStorage.getItem(SESSION_SUPPRESS_RELEASE_NOTES_NEW_SIGNUP_KEY) === "1";

  useEffect(() => {
    if (skipHost) return;
    if (!latestRelease || latestRelease.seen) return;
    if (!suppressForNewSignup) return;
    const id = latestRelease.id;
    queryClient.setQueryData(releaseNoteKeys.latest(), (prev: LatestReleaseNote | null | undefined) =>
      prev && prev.id === id ? { ...prev, seen: true } : prev
    );
    void markReleaseNoteSeen(id).catch(() => {
      // Non-fatal: cache update already prevents the modal this session.
    });
  }, [latestRelease, suppressForNewSignup, skipHost, queryClient]);

  useEffect(() => {
    if (skipHost) return;
    if (!latestRelease || latestRelease.seen) return;
    if (welcomePending || suppressForNewSignup) return;
    setPendingNote((prev) => (prev?.id === latestRelease.id ? prev : latestRelease));
  }, [latestRelease, welcomePending, suppressForNewSignup, skipHost, userId]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    setPendingNote((current) => {
      if (current) {
        const id = current.id;
        queryClient.setQueryData(releaseNoteKeys.latest(), (prev: LatestReleaseNote | null | undefined) =>
          prev && prev.id === id ? { ...prev, seen: true } : prev
        );
        void markReleaseNoteSeen(id).finally(() => {
          void queryClient.invalidateQueries({ queryKey: releaseNoteKeys.latest() });
        });
      }
      return null;
    });
  };

  if (!pendingNote || skipHost) return null;

  return (
    <ReleaseNotesModal
      mode="release-notes"
      open
      onOpenChange={handleOpenChange}
      ariaTitle={`What's new in Continuum v${pendingNote.version}`}
      ariaDescription={pendingNote.title}
      title={<span className="font-['Satoshi',sans-serif] font-medium text-[#0b191f]">{pendingNote.title}</span>}
      description={<span className="whitespace-pre-wrap">{pendingNote.content}</span>}
      checklistItems={pendingNote.checklist_items}
      primaryButtonLabel="Got it"
      rightPanelBadge={`v${pendingNote.version}`}
    />
  );
}
