import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";

/**
 * Clears ALL cached server data when the session ends so the next account
 * never sees anything from the previous user (projects, tasks, invoices, PII).
 * Runs in an effect AFTER the auth flip re-renders the tree, so the protected
 * pages are already unmounted and clearing cannot trigger unauthenticated
 * refetches from still-subscribed observers.
 */
export function AuthQueryCacheSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear();
    }
  }, [isAuthenticated, queryClient]);

  return null;
}
