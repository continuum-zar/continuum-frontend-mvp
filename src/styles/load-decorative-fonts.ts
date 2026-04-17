/**
 * Sarina (npm) + Satoshi (Fontshare). Loaded only for marketing, onboarding,
 * dashboard-placeholder flows, and similar routes — not on the main /dashboard shell.
 *
 * Sarina @font-face uses font-display: swap (via @fontsource/sarina). We defer
 * applying the Sarina family until the face is ready — see sarina-font.css + html.sarina-loaded.
 */
import FontFaceObserver from "fontfaceobserver";
import "@fontsource/sarina";
import "./fonts-satoshi.css";

const SARINA_LOAD_TIMEOUT_MS = 20_000;

function markSarinaReady(): void {
  document.documentElement.classList.add("sarina-loaded");
}

if (typeof document !== "undefined" && !document.documentElement.classList.contains("sarina-loaded")) {
  const sarina = new FontFaceObserver("Sarina", { weight: 400 });
  void sarina
    .load(null, SARINA_LOAD_TIMEOUT_MS)
    .then(markSarinaReady)
    .catch(() => {
      /* Keep .font-sarina / .font-sarina-sans fallback stacks */
    });
}
