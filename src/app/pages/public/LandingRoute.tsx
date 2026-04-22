import { Navigate, useLocation } from "react-router";
import "@/styles/load-decorative-fonts";
import { peekGithubOAuthReturnPath } from "@/lib/githubOAuthReturn";
import { WORKSPACE_BASE } from "@/lib/workspacePaths";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/app/components/ui/skeleton";
import LandingPage from "./LandingPage";

/**
 * Public marketing landing at `/`. Authenticated users are sent to the default tasks board.
 *
 * Special case: after the backend completes a GitHub OAuth round-trip it redirects here
 * with ``?github_oauth=success|error``. If the user saved a return path before starting
 * OAuth we send them back there directly (skipping the default-board resolver), so the
 * handler inside AuthGuard can show feedback on the page they came from.
 */
export function LandingRoute() {
  const location = useLocation();
  const { isAuthenticated, isInitialized, accessToken } = useAuthStore();

  if (!isInitialized && accessToken) {
    return (
      <div className="flex min-h-screen flex-col space-y-3 bg-[#f9fafb] p-8">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const hasGithubOAuthParams = new URLSearchParams(location.search).has("github_oauth");
    const returnPath = hasGithubOAuthParams ? peekGithubOAuthReturnPath() : null;
    if (returnPath) {
      const [pathname, existingSearch = ""] = returnPath.split("?");
      const merged = new URLSearchParams(existingSearch);
      const incoming = new URLSearchParams(location.search);
      incoming.forEach((v, k) => merged.set(k, v));
      const search = merged.toString();
      return (
        <Navigate
          to={{ pathname, search: search ? `?${search}` : "" }}
          replace
        />
      );
    }

    return (
      <Navigate
        to={{ pathname: WORKSPACE_BASE, search: location.search }}
        replace
      />
    );
  }

  return (
    <main className="relative h-[2870px] min-h-screen w-full overflow-hidden bg-[#f9fafb]">
      <LandingPage />
    </main>
  );
}
