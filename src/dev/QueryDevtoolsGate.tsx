import { lazy, Suspense } from "react";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((d) => ({
    default: d.ReactQueryDevtools,
  })),
);

/**
 * TanStack Query Devtools — **opt-in only** (`VITE_ENABLE_QUERY_DEVTOOLS=true`).
 *
 * Relying on `import.meta.env.DEV` is not enough when the deployed image runs
 * `vite` in dev mode (e.g. repo Dockerfile uses `npm run dev`), which keeps
 * `DEV === true`. A static `vite build` + `import.meta.env.PROD` would hide
 * them, but opt-in avoids leaking the floating button in any environment.
 */
export function QueryDevtoolsGate() {
  if (import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS !== "true") return null;
  return (
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </Suspense>
  );
}
