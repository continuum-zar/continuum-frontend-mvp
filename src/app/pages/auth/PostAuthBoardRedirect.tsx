import { useEffect } from "react";
import { useNavigate } from "react-router";

import { RouteSkeleton } from "@/app/components/ui/RouteSkeleton";
import { resolveDefaultBoardPath } from "@/lib/defaultBoardPath";

/**
 * Resolves the default tasks-board URL (Welcome get-started vs first project sprint)
 * and replaces history. Used when an authenticated user hits `/` or similar entry points.
 */
export function PostAuthBoardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    resolveDefaultBoardPath().then((path) => {
      if (!cancelled) navigate(path, { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return <RouteSkeleton />;
}
