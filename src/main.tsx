import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryDevtoolsGate } from "./dev/QueryDevtoolsGate.tsx";
// Package root resolves to index.css (same as wght.css); avoids subpath export issues in some Docker/CI setups.
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import App from "./app/App.tsx";
import "./styles/index.css";
import { DEFAULT_GC_MS, DEFAULT_STALE_MS } from "./lib/queryDefaults.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_MS,
      gcTime: DEFAULT_GC_MS,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <QueryDevtoolsGate />
  </QueryClientProvider>
);
