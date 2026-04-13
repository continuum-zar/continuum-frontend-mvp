import { Navigate } from "react-router";
import "@/styles/load-decorative-fonts";
import { workspaceJoin } from "@/lib/workspacePaths";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/app/components/ui/skeleton";
import LandingPage from "./LandingPage";

/**
 * Public marketing landing at `/`. Authenticated users are sent to the default tasks board.
 */
export function LandingRoute() {
  const { isAuthenticated, isInitialized, accessToken } = useAuthStore();

  // Match AuthGuard: while a stored token may still be valid, wait before showing marketing.
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
    return <Navigate to={workspaceJoin("entry")} replace />;
  }

  return (
    <main className="relative h-[2870px] min-h-screen w-full overflow-hidden bg-[#f9fafb]">
      <LandingPage />
    </main>
  );
}
