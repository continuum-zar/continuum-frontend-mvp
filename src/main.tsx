import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryDevtoolsGate } from "./dev/QueryDevtoolsGate.tsx";
import App from "./app/App.tsx";
// Manrope + JetBrains Mono are @imported from index.css so the browser fetches
// them as part of the main stylesheet, in parallel with the JS bundle.
import "./styles/index.css";
import { DEFAULT_GC_MS, DEFAULT_STALE_MS } from "./lib/queryDefaults.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_MS,
      gcTime: DEFAULT_GC_MS,
      refetchOnWindowFocus: false,
      // Flaky 4G: avoid 3× default retries that compound with the axios 30s timeout into multi-minute stalls.
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status != null && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
      // On a flaky mobile network the connection flaps; default `true` causes a refetch-storm every reconnect.
      refetchOnReconnect: false,
      networkMode: "online",
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <QueryDevtoolsGate />
  </QueryClientProvider>
);

/**
 * Decorative fonts (Sarina + Satoshi) are imported at idle-time so they fetch
 * in parallel with the first interactions instead of gating any render. The
 * import is cached, so subsequent `import()` calls elsewhere are free.
 */
if (typeof window !== "undefined") {
  type IdleHandle = number;
  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => IdleHandle;
  };
  const load = () => {
    void import("./styles/load-decorative-fonts");
  };
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(load, { timeout: 2_000 });
  } else {
    window.setTimeout(load, 1_500);
  }
}
