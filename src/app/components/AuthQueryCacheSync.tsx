import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { projectKeys } from "@/api/projects";
import { useAuthStore } from "@/store/authStore";

/**
 * Clears user-scoped server data when the session ends so the next account
 * never sees cached projects/tasks from the previous user.
 */
export function AuthQueryCacheSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.removeQueries({ queryKey: projectKeys.all });
      queryClient.removeQueries({ queryKey: ["tasks", "all"] });
      queryClient.removeQueries({ queryKey: ["logged-hours"] });
    }
  }, [isAuthenticated, queryClient]);

  return null;
}
