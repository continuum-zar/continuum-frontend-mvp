import { createRoot } from "react-dom/client";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryDevtoolsGate } from "./dev/QueryDevtoolsGate.tsx";
import App from "./app/App.tsx";
// Satoshi is @imported from index.css so it loads with the main stylesheet.
import "./styles/index.css";
import { DEFAULT_GC_MS, DEFAULT_STALE_MS } from "./lib/queryDefaults.ts";
import { tryReloadForStaleChunk } from "./lib/staleClientChunk.ts";
import { onMutationCacheError, onQueryCacheError } from "./lib/globalQueryErrors.ts";
import { installGlobalErrorListeners } from "./lib/installGlobalErrorListeners.ts";
import { clerkPublishableKey, isClerkEnabled } from "./lib/clerkConfig.ts";

if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    void tryReloadForStaleChunk();
  });
  installGlobalErrorListeners();
}

const queryClient = new QueryClient({
  // Safety net: friendly toast for any query/mutation error not handled locally.
  queryCache: new QueryCache({ onError: onQueryCacheError }),
  mutationCache: new MutationCache({ onError: onMutationCacheError }),
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

const appTree = (
  <QueryClientProvider client={queryClient}>
    <App />
    <QueryDevtoolsGate />
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  isClerkEnabled && clerkPublishableKey
    ? (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/login">
        {appTree}
      </ClerkProvider>
    )
    : appTree,
);
