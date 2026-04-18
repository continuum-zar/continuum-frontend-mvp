import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Runs `checkAuth()` once while `isInitialized` is false so public routes
 * (`/`, `/invite`, etc.) don’t sit behind loaders forever. Protected routes use
 * `AuthGuard` too; `checkAuth` short-circuits duplicate work via `isLoading`.
 *
 * With a token: validates `/users/me`. Without: sets `isInitialized` immediately.
 */
export function AuthSessionBootstrap() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    if (!isInitialized) {
      void checkAuth();
    }
  }, [isInitialized, checkAuth]);

  return null;
}
