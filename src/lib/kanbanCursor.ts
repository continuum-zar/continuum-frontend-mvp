/**
 * Toggle `data-kanban-dragging` on <html> during pointer-based Kanban drag.
 * CSS in theme.css handles the actual cursor image via this attribute.
 * (No inline style hacks needed — pointer events respect CSS `cursor` fully.)
 */
export function setKanbanDragActive(active: boolean): void {
  if (typeof document === "undefined") return;
  if (active) {
    document.documentElement.setAttribute("data-kanban-dragging", "");
  } else {
    document.documentElement.removeAttribute("data-kanban-dragging");
  }
}
