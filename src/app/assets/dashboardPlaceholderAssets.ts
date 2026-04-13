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

/** Figma node [77:13501](https://www.figma.com/design/85TFw1LCFTEYQZR3NCEu0x/playground?node-id=77-13501) — bot icon for AI Project Planner. */
export const aiPlannerBotIconSrc = mcpAsset(
  "b62f5fe6-85e3-468f-8f61-112be7738bb5",
);

/** Composer toolbar — from Figma frame [77:13509](https://www.figma.com/design/85TFw1LCFTEYQZR3NCEu0x/playground?node-id=77-13509) (matches input area; node `77:13681` unavailable via MCP). */
export const aiPlannerComposerPlusSrc = mcpAsset(
  "f784f4a7-4eab-4a88-bca3-288ee84d6e0e",
);
export const aiPlannerComposerSettingsSrc = mcpAsset(
  "b2143832-cdad-4ce2-b739-321c71011f3a",
);
export const aiPlannerComposerSendSquareSrc = mcpAsset(
  "8d96034b-2369-473d-ada7-32f67aaefc55",
);
