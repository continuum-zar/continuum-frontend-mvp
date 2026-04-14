/** Intrinsic SVG size (width/height on assets + theme.css `url()` hotspot coords). */
export const CURSOR_ASSET_INTRINSIC_PX = 56;

/** Overlay `<img>` is drawn at this size; hotspots are scaled from intrinsic coords in applyTransform. */
export const CURSOR_OVERLAY_DISPLAY_PX = 40;

/** Hotspots match theme.css — pixel coords in the 56×56 intrinsic cursor image. */
export const CURSOR_HOTSPOTS = {
  default: { x: 7, y: 7 },
  pointer: { x: 16, y: 12 },
  grab: { x: 19, y: 21 },
  grabbing: { x: 19, y: 23 },
  textCursor: { x: 17, y: 10 },
} as const;

export type CustomCursorKind = keyof typeof CURSOR_HOTSPOTS;

const CURSOR_FILES: Record<CustomCursorKind, string> = {
  default: "default.svg",
  pointer: "handpointing.svg",
  grab: "handopen.svg",
  grabbing: "handgrabbing.svg",
  textCursor: "textcursor.svg",
};

function assetPath(relative: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${relative}`.replace(/\/{2,}/g, "/");
}

export function cursorAssetUrl(kind: CustomCursorKind): string {
  if (typeof window === "undefined") return "";
  const file = CURSOR_FILES[kind];
  return new URL(assetPath(`assets/cursors/${file}`), window.location.origin).href;
}
