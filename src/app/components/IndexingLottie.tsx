import { useState } from "react";
import type { ReactNode } from "react";
import { DotLottieReact, setWasmUrl, type DotLottie } from "@lottiefiles/dotlottie-react";
// Self-host the renderer WASM (served from our own origin) so it works offline
// and does not need a third-party CDN in the CSP `connect-src` allowlist.
import dotLottieWasmUrl from "@lottiefiles/dotlottie-web/dotlottie-player.wasm?url";

setWasmUrl(dotLottieWasmUrl);

/**
 * Indexing animation shown while the reporting assistant prepares/indexes project
 * context. Self-hosted Lottie JSON from `public/assets/animations` (served from
 * our own origin, so no CSP exception or network dependency).
 */
const INDEXING_ANIMATION_SRC = `${import.meta.env.BASE_URL}assets/animations/toaster.json`;

export function IndexingLottie({
  className,
  fallback,
}: {
  className?: string;
  /** Rendered if the animation fails to load (dead link / offline). */
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback ?? null}</>;

  return (
    <DotLottieReact
      src={INDEXING_ANIMATION_SRC}
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
