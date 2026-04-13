/** Hotspots match theme.css — image pixel coords for aligning the pointer with the artwork. */
export const CURSOR_HOTSPOTS = {
  default: { x: 10, y: 10 },
  pointer: { x: 22, y: 16 },
  grab: { x: 24, y: 26 },
  grabbing: { x: 24, y: 28 },
} as const;

export type CustomCursorKind = keyof typeof CURSOR_HOTSPOTS;

function assetPath(relative: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${relative}`.replace(/\/{2,}/g, "/");
}

export function cursorAssetUrl(kind: CustomCursorKind): string {
  if (typeof window === "undefined") return "";
  const file =
    kind === "default"
      ? "default.svg"
      : kind === "pointer"
        ? "handpointing.svg"
        : kind === "grab"
          ? "handopen.svg"
          : "handgrabbing.svg";
  return new URL(assetPath(`assets/cursors/${file}`), window.location.origin).href;
}
