/**
 * Local copies of former Figma MCP assets under `public/assets/dashboard-placeholder/`.
 * Regenerate files with `scripts/download-dashboard-placeholder-assets.sh` if needed.
 */
const BASE = "/assets/dashboard-placeholder";

/** PNG exports (most MCP icons are SVG). */
const PNG_IDS = new Set<string>(["0a33d0b2-07cc-4490-b6ee-909fecb0efb5"]);

export function mcpAsset(uuid: string): string {
  const ext = PNG_IDS.has(uuid) ? "png" : "svg";
  return `${BASE}/${uuid}.${ext}`;
}
