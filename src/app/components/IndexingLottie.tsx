import { useState } from "react";
import type { ReactNode } from "react";
import { DotLottieReact, setWasmUrl, type DotLottie } from "@lottiefiles/dotlottie-react";
// Self-host the renderer WASM (served from our own origin) so it works offline
// and does not need a third-party CDN in the CSP `connect-src` allowlist.
import dotLottieWasmUrl from "@lottiefiles/dotlottie-web/dotlottie-player.wasm?url";

setWasmUrl(dotLottieWasmUrl);

/**
 * Assistant progress animations. Self-hosted Lottie JSON from
 * `public/assets/animations` (served from our own origin, so no CSP exception
 * or network dependency). `toaster` plays while the reporting assistant
 * prepares/indexes project context; `processing` plays while the task
 * assistant is thinking and creating tasks.
 */
const ANIMATION_SRC = {
  toaster: `${import.meta.env.BASE_URL}assets/animations/toaster.json`,
  processing: `${import.meta.env.BASE_URL}assets/animations/processing.json`,
} as const;

export function IndexingLottie({
  className,
  fallback,
  animation = "toaster",
}: {
  className?: string;
  /** Rendered if the animation fails to load (dead link / offline). */
  fallback?: ReactNode;
  animation?: keyof typeof ANIMATION_SRC;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback ?? null}</>;

  return (
    <DotLottieReact
      src={ANIMATION_SRC[animation]}
      loop
      autoplay
      className={className}
      dotLottieRefCallback={(dotLottie: DotLottie | null) => {
        if (!dotLottie) return;
        dotLottie.addEventListener("loadError", () => setFailed(true));
      }}
    />
  );
}
