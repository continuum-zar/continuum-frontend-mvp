import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import { RouteSkeleton } from "@/app/components/ui/RouteSkeleton";
import { resolveDefaultBoardPath } from "@/lib/defaultBoardPath";

/**
 * Resolves the default tasks-board URL (Welcome sprint board vs first project sprint)
 * and replaces history. Used when an authenticated user hits `/` or similar entry points.
 */
export function PostAuthBoardRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    resolveDefaultBoardPath().then((path) => {
      if (!cancelled) navigate({ pathname: path, search: location.search }, { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate, location.search]);

  return <RouteSkeleton />;
}
