#!/usr/bin/env bash
# Re-download Figma MCP assets listed in src/ into public/assets/dashboard-placeholder/.
# Run from repo root if remote URLs still return 200; otherwise restore assets from git.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/assets/dashboard-placeholder"
mkdir -p "$OUT"
grep -rhoE 'https://www\.figma\.com/api/mcp/asset/[a-f0-9-]+' "$ROOT/src" | sort -u | while read -r url; do
  id="${url##*/}"
  tmp="$OUT/${id}.download"
  if curl -sfL "$url" -o "$tmp"; then
    mt=$(file -b --mime-type "$tmp")
    case "$mt" in
      image/png) mv "$tmp" "$OUT/${id}.png" ;;
      image/svg+xml) mv "$tmp" "$OUT/${id}.svg" ;;
      image/jpeg) mv "$tmp" "$OUT/${id}.jpg" ;;
      *)
        if head -c 8 "$tmp" | od -An -tx1 2>/dev/null | grep -q '89 50'; then mv "$tmp" "$OUT/${id}.png"
        elif head -c 5 "$tmp" | grep -q '<svg'; then mv "$tmp" "$OUT/${id}.svg"
        else mv "$tmp" "$OUT/${id}.bin"
        fi ;;
    esac
    echo "ok $id"
  else
    echo "fail $url" >&2
    rm -f "$tmp"
  fi
done
