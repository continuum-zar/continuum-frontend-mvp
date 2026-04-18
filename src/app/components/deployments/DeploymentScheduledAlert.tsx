"use client";

import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { deploymentEventsStreamUrl } from "@/api/deployments";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { useAuthStore } from "@/store/authStore";

function formatScheduledAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/**
 * Subscribes to deployment SSE while authenticated and shows a blocking modal when an admin
 * schedules a deployment (broadcast to all sessions).
 */
export function DeploymentScheduledAlert() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [minutesUntil, setMinutesUntil] = useState<number>(15);

  const handleMessage = useCallback(
    (ev: MessageEvent<string>) => {
      try {
        const data = JSON.parse(ev.data) as {
          type?: string;
          scheduled_at?: string;
          minutes_until?: number;
          auth_deployment_epoch?: number;
        };
        if (data.type === "session_invalidation") {
          void (async () => {
            await logout();
            // This component mounts above <RouterProvider>, so useNavigate is invalid here — full navigation.
            if (typeof window !== "undefined") {
              window.location.replace("/login");
            }
          })();
          return;
        }
        if (data.type === "deployment_scheduled" && data.scheduled_at) {
          setScheduledAt(data.scheduled_at);
          setMinutesUntil(typeof data.minutes_until === "number" ? data.minutes_until : 15);
          setOpen(true);
        }
      } catch {
        /* ignore malformed */
      }
    },
    [logout],
  );

  useEffect(() => {
    // Only connect once /users/me has confirmed the token + resolved the user.
    // Avoids opening the stream with a stale localStorage token on refresh and
    // stops the SSE from racing with the main data fetches on the critical path.
    if (!isInitialized || !isAuthenticated || !accessToken || !user) {
      setOpen(false);
      return;
    }

    type IdleHandle = number;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => IdleHandle;
      cancelIdleCallback?: (handle: IdleHandle) => void;
    };

    let es: EventSource | null = null;
    let idleHandle: IdleHandle | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const openStream = () => {
      if (cancelled) return;
      const url = deploymentEventsStreamUrl(accessToken);
      es = new EventSource(url);
      es.addEventListener("message", handleMessage as EventListener);
      // Silence the noisy "connection was interrupted" log on HMR/navigation —
      // the browser cancels in-flight requests during refresh, which is not an
      // actionable error for users. Downgrade to debug so it's still inspectable.
      es.onerror = () => {
        console.debug("[DeploymentScheduledAlert] SSE stream closed or errored");
        es?.close();
      };
    };

    if (typeof win.requestIdleCallback === "function") {
      idleHandle = win.requestIdleCallback(openStream, { timeout: 3_000 });
    } else {
      timeoutHandle = setTimeout(openStream, 1_500);
    }

    return () => {
      cancelled = true;
      if (idleHandle != null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle != null) {
        clearTimeout(timeoutHandle);
      }
      if (es) {
        es.removeEventListener("message", handleMessage as EventListener);
        es.close();
      }
    };
  }, [accessToken, isAuthenticated, isInitialized, user, handleMessage]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay className="z-[200] bg-black/60" />
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[201] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-[#ebedee] p-6 font-['Satoshi',sans-serif] shadow-lg duration-200 sm:max-w-md",
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-[#0b191f]">Deployment scheduled</DialogTitle>
            <DialogDescription className="text-left text-[15px] leading-relaxed text-[#606d76]">
              A production deployment is planned in approximately {minutesUntil} minutes
              {scheduledAt ? ` (around ${formatScheduledAt(scheduledAt)})` : ""}. Please save your work now. The app may
              be briefly unavailable during the update.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="w-full rounded-[8px] bg-[#0b191f] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[#152a35] sm:w-auto"
              onClick={() => setOpen(false)}
            >
              I understand
            </button>
          </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
