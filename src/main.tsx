import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryDevtoolsGate } from "./dev/QueryDevtoolsGate.tsx";
// Package root resolves to index.css (same as wght.css); avoids subpath export issues in some Docker/CI setups.
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import App from "./app/App.tsx";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      // Keep unused cache around for 5 minutes by default to avoid
      // refetching when users navigate back and forth between views.
      gcTime: 5 * 60 * 1000,
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
