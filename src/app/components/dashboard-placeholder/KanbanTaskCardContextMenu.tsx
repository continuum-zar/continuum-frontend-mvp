"use client";

import type { ReactNode } from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/app/components/ui/context-menu";
import { cn } from "@/app/components/ui/utils";
import {
  ArrowRightLeft,
  ExternalLink,
  Link2,
  Pencil,
  Trash2,
  UserRoundPlus,
} from "lucide-react";

import { memberAvatarBackground } from "@/lib/memberAvatar";
import type { Member } from "@/types/member";
import {
  dashboardPlaceholderFloatingMenuContentClassName,
  dashboardPlaceholderMenuOptionChipClassName,
  dashboardPlaceholderMenuOptionIconClass,
  dashboardPlaceholderMenuStackClassName,
  dashboardPlaceholderSatoshi,
} from "./dashboardPlaceholderMenuChips";
import type { KanbanColumnKind } from "./kanbanBoardTypes";

const satoshi = dashboardPlaceholderSatoshi;

const optionIconClass = dashboardPlaceholderMenuOptionIconClass;
const optionChipClassName = dashboardPlaceholderMenuOptionChipClassName;
const menuStackClassName = dashboardPlaceholderMenuStackClassName;

export type KanbanTaskCardContextMenuProps = {
  children: ReactNode;
  taskId: string;
  /** Resolved column id for this task (matches board column `id`). */
  currentColumnId: string;
  /** Column kind for menu placement (e.g. open left when ``done``). */
  currentColumnKind: KanbanColumnKind;
  /** Board columns offered in “Move to…”. */
  moveColumnOptions: { id: string; label: string }[];
  onOpenTask: () => void;
  onEditTask: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
  onMoveToColumn: (columnId: string) => void;
  /** Project members for the "Assign member" inline picker. Omit/empty to hide the option. */
  members?: Member[];
  /** Current assignee's user id, or null when unassigned. */
  currentAssigneeId?: number | null;
  /** Fired from the inline member picker. Pass `null` to unassign. Omit to hide the option. */
  onAssignMember?: (userId: number | null) => void;
};

/** Radix positions context UI with `side: right` from the cursor; we shift the stack for completed tasks. */
const contentRootClassName = dashboardPlaceholderFloatingMenuContentClassName;

/**
 * Submenu container — no parent background, border, padding, or shadow; the option chips
 * stand alone over the dim backdrop (matches the top-level menu style).
 */
const subShellClassName = cn(
  menuStackClassName,
  "min-w-[11rem] gap-2",
  "!bg-transparent !border-0 !p-0 !shadow-none !rounded-none !overflow-visible",
);

/** Scroll works, scrollbar is visually hidden to keep the floating menu clean. */
const assignMemberListClassName = cn(
  "flex max-h-[220px] flex-col gap-2 overflow-y-auto overflow-x-visible",
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
);

const dimPanelClass =
  "pointer-events-none fixed z-[190] bg-[#1a1d21]/[0.28] backdrop-grayscale motion-reduce:backdrop-grayscale-0";

/** Matches board task cards in GetStartedKanbanLive (`rounded-[16px]`). */
const KANBAN_CARD_FOCUS_HOLE_RADIUS_PX = 16;

/**
 * Full-viewport dim except a rounded hole aligned to the card so the right-clicked card stays full color.
 */
function ContextMenuDimBackdrop({ hole }: { hole: DOMRect | null }) {
  const maskId = useId().replace(/:/g, "");
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useLayoutEffect(() => {
    const sync = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (!hole || hole.width < 1 || hole.height < 1 || viewport.w < 1) {
    return (
      <div className={cn(dimPanelClass, "inset-0")} style={{ position: "fixed" }} aria-hidden />
    );
  }

  const { left: l, top: t, width: hw, height: hh } = hole;
  const { w: vw, h: vh } = viewport;
  const maskUrl = `url(#${maskId})`;

  return (
    <>
      <svg
        className="pointer-events-none fixed z-[190] size-0 overflow-hidden"
        aria-hidden
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={vw}
            height={vh}
          >
            <rect x={0} y={0} width={vw} height={vh} fill="white" />
            <rect
              x={l}
              y={t}
              width={hw}
              height={hh}
              rx={KANBAN_CARD_FOCUS_HOLE_RADIUS_PX}
              ry={KANBAN_CARD_FOCUS_HOLE_RADIUS_PX}
              fill="black"
            />
          </mask>
        </defs>
      </svg>
      <div
        className={cn(dimPanelClass, "inset-0")}
        style={{ position: "fixed", mask: maskUrl, WebkitMask: maskUrl }}
        aria-hidden
      />
    </>
  );
}

/**
 * Right-click menu for Kanban cards — keyboard accessible via Radix; closes on outside click / Escape.
 * Left-click drag uses {@link useKanbanPointerDrag} (button 0 only); context menu does not start a drag.
 */
export function KanbanTaskCardContextMenu({
  children,
  taskId,
  currentColumnId,
  currentColumnKind,
  moveColumnOptions,
  onOpenTask,
  onEditTask,
  onCopyLink,
  onDelete,
  onMoveToColumn,
  members,
  currentAssigneeId = null,
  onAssignMember,
}: KanbanTaskCardContextMenuProps) {
  const canAssign = typeof onAssignMember === "function" && (members?.length ?? 0) > 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardHole, setCardHole] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  /** Ref to the in-menu stack. Resolving the popper wrapper from a live ref avoids
   *  the portal-mount race that `document.querySelector` used to hit on first open. */
  const stackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setCardHole(null);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const updateHole = () => setCardHole(el.getBoundingClientRect());
    updateHole();
    window.addEventListener("scroll", updateHole, true);
    window.addEventListener("resize", updateHole);
    return () => {
      window.removeEventListener("scroll", updateHole, true);
      window.removeEventListener("resize", updateHole);
    };
  }, [menuOpen]);

  /**
   * Align the menu with the card instead of the cursor:
   * - "todo" / "in-progress" → opens to the right of the card
   * - "done" → opens to the left of the card (avoids viewport clipping on the right column)
   * - Menu top is aligned with the card top.
   * We override Radix's popper wrapper inline style and reapply via MutationObserver,
   * because Radix repositions on scroll/resize via @floating-ui autoUpdate.
   */
  const openToLeft = currentColumnKind === "done";

  useLayoutEffect(() => {
    if (!menuOpen || !cardHole) return;

    const GAP = 10;
    const EDGE_PADDING = 8;

    let observer: MutationObserver | null = null;
    let cancelled = false;
    const rafIds: number[] = [];

    /** Resolve the Radix popper wrapper from the stack ref. Returns null if Radix's
     *  portal hasn't finished mounting yet (we retry on the next frame in that case). */
    const resolveTargets = () => {
      const stack = stackRef.current;
      if (!stack) return null;
      const wrapper = stack.closest<HTMLElement>(
        "[data-radix-popper-content-wrapper]",
      );
      if (!wrapper) return null;
      const content = stack.parentElement;
      return { wrapper, content: content as HTMLElement | null, stack };
    };

    const apply = () => {
      if (cancelled) return;
      const targets = resolveTargets();
      if (!targets) return;
      const { wrapper, content, stack } = targets;
      observer?.disconnect();

      const menuWidth = (content?.offsetWidth || stack.offsetWidth) || 220;
      const menuHeight = content?.offsetHeight || stack.offsetHeight || 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = openToLeft ? cardHole.left - menuWidth - GAP : cardHole.right + GAP;
      x = Math.min(
        Math.max(EDGE_PADDING, x),
        Math.max(EDGE_PADDING, vw - menuWidth - EDGE_PADDING),
      );

      let y = cardHole.top;
      if (menuHeight > 0) {
        y = Math.min(y, Math.max(EDGE_PADDING, vh - menuHeight - EDGE_PADDING));
      }

      wrapper.style.setProperty("position", "fixed", "important");
      wrapper.style.setProperty("top", "0px", "important");
      wrapper.style.setProperty("left", "0px", "important");
      wrapper.style.setProperty(
        "transform",
        `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`,
        "important",
      );
      wrapper.style.setProperty("min-width", "auto", "important");
      wrapper.style.setProperty("max-height", "none", "important");
      wrapper.style.setProperty("z-index", "200", "important");

      if (!observer) observer = new MutationObserver(apply);
      observer.observe(wrapper, { attributes: true, attributeFilter: ["style"] });
    };

    /**
     * Radix / floating-ui applies its initial positioning asynchronously via
     * requestAnimationFrame after the portal mounts, and may re-run over the next
     * few frames. Re-applying on every frame for a short window guarantees our
     * alignment wins regardless of which frame Radix finalizes on. The
     * MutationObserver then keeps the override in place for scroll/resize.
     */
    const BRUTE_FORCE_FRAMES = 20;
    const schedule = (framesLeft: number) => {
      if (cancelled || framesLeft <= 0) return;
      const id = requestAnimationFrame(() => {
        apply();
        schedule(framesLeft - 1);
      });
      rafIds.push(id);
    };

    apply();
    schedule(BRUTE_FORCE_FRAMES);

    return () => {
      cancelled = true;
      observer?.disconnect();
      rafIds.forEach((id) => cancelAnimationFrame(id));
    };
  }, [menuOpen, cardHole, openToLeft]);

  return (
    <ContextMenu
      onOpenChange={(open) => {
        setMenuOpen(open);
        if (!open) setCardHole(null);
      }}
    >
      {menuOpen ? createPortal(<ContextMenuDimBackdrop hole={cardHole} />, document.body) : null}
      <ContextMenuTrigger asChild>
        <div
          ref={triggerRef}
          data-kanban-card-context-trigger
          data-testid={`kanban-task-menu-trigger-${taskId}`}
          className="w-full"
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className={contentRootClassName}
        data-kanban-task-menu=""
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div ref={stackRef} className={menuStackClassName}>
          <ContextMenuItem
            className={optionChipClassName}
            onSelect={() => {
              onOpenTask();
            }}
          >
            <ExternalLink className={optionIconClass} aria-hidden />
            Open task
          </ContextMenuItem>
          <ContextMenuItem
            className={optionChipClassName}
            onSelect={() => {
              onEditTask();
            }}
          >
            <Pencil className={optionIconClass} aria-hidden />
            Edit task
          </ContextMenuItem>
          {canAssign ? (
            <ContextMenuSub>
              <ContextMenuSubTrigger
                className={cn(
                  optionChipClassName,
                  "data-[state=open]:bg-[#f5f7f8] data-[state=open]:text-[#0b191f] data-[state=open]:shadow-md",
                )}
              >
                <UserRoundPlus className={optionIconClass} aria-hidden />
                Assign member
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className={subShellClassName} sideOffset={8}>
                <div className={assignMemberListClassName}>
                  <ContextMenuItem
                    className={optionChipClassName}
                    disabled={currentAssigneeId == null}
                    onSelect={() => {
                      if (currentAssigneeId != null) onAssignMember?.(null);
                    }}
                  >
                    <div
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-[#cdd2d5] bg-[#fafbfc]"
                      aria-hidden
                    >
                      <span className="text-[10px] leading-none text-[#727d83]">—</span>
                    </div>
                    Unassigned
                    {currentAssigneeId == null ? (
                      <span className={cn(satoshi, "ml-auto text-xs font-normal text-[#727d83]")}>
                        Current
                      </span>
                    ) : null}
                  </ContextMenuItem>
                  {members?.map((m) => {
                    const isCurrent = currentAssigneeId === m.userId;
                    return (
                      <ContextMenuItem
                        key={m.userId}
                        className={optionChipClassName}
                        disabled={isCurrent}
                        onSelect={() => {
                          if (!isCurrent) onAssignMember?.(m.userId);
                        }}
                      >
                        <div
                          className="flex size-5 shrink-0 items-center justify-center rounded-full border border-solid border-white"
                          style={{ backgroundColor: memberAvatarBackground(m.userId) }}
                          aria-hidden
                        >
                          <span className="font-['Satoshi:Medium',sans-serif] text-[9px] leading-none text-white">
                            {m.initials}
                          </span>
                        </div>
                        <span className="truncate">{m.name}</span>
                        {isCurrent ? (
                          <span className={cn(satoshi, "ml-auto text-xs font-normal text-[#727d83]")}>
                            Current
                          </span>
                        ) : null}
                      </ContextMenuItem>
                    );
                  })}
                </div>
              </ContextMenuSubContent>
            </ContextMenuSub>
          ) : null}
          <ContextMenuSub>
            <ContextMenuSubTrigger
              className={cn(
                optionChipClassName,
                "data-[state=open]:bg-[#f5f7f8] data-[state=open]:text-[#0b191f] data-[state=open]:shadow-md",
              )}
            >
              <ArrowRightLeft className={optionIconClass} aria-hidden />
              Move to…
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className={subShellClassName} sideOffset={8}>
              {moveColumnOptions.map(({ id, label }) => (
                <ContextMenuItem
                  key={id}
                  className={optionChipClassName}
                  disabled={currentColumnId === id}
                  onSelect={() => {
                    if (currentColumnId !== id) onMoveToColumn(id);
                  }}
                >
                  {label}
                  {currentColumnId === id ? (
                    <span className={cn(satoshi, "ml-auto text-xs font-normal text-[#727d83]")}>Current</span>
                  ) : null}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem
            className={optionChipClassName}
            onSelect={() => {
              onCopyLink();
            }}
          >
            <Link2 className={optionIconClass} aria-hidden />
            Copy link
          </ContextMenuItem>
          <ContextMenuItem
            className={optionChipClassName}
            onSelect={() => {
              onDelete();
            }}
          >
            <Trash2 className={optionIconClass} aria-hidden />
            Delete task
          </ContextMenuItem>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
}
