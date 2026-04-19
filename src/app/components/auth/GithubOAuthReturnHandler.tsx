import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { githubAppKeys } from "@/api/githubApp";

/**
 * After GitHub redirects back to the SPA (`?github_oauth=success|error&...`), show feedback and strip params.
 * Must run under an authenticated router tree so query invalidation applies.
 */
export function GithubOAuthReturnHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const processedKey = useRef<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("github_oauth");
    if (!status) {
      processedKey.current = null;
      return;
    }

    const fingerprint = `${status}|${searchParams.get("project_id") ?? ""}|${searchParams.get("reason") ?? ""}`;
    if (processedKey.current === fingerprint) return;
    processedKey.current = fingerprint;

    if (status === "success") {
      const pid = searchParams.get("project_id");
      toast.success(pid ? `GitHub connected for project ${pid}` : "GitHub connected");
      void queryClient.invalidateQueries({ queryKey: githubAppKeys.all });
    } else {
      const reason = searchParams.get("reason") ?? "error";
      const detail = searchParams.get("detail");
      toast.error(detail ? `GitHub: ${reason} — ${detail}` : `GitHub: ${reason}`);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("github_oauth");
    next.delete("project_id");
    next.delete("reason");
    next.delete("detail");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  return null;
}
