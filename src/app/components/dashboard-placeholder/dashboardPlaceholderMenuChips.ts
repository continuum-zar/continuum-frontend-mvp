import { cn } from "@/app/components/ui/utils";

/** Satoshi — dashboard placeholder typography. */
export const dashboardPlaceholderSatoshi = "font-['Satoshi',sans-serif]";

/**
 * Vertical stack for floating menus (Kanban task card menu, column kebab, etc.).
 * Matches `KanbanTaskCardContextMenu` chip layout.
 */
export const dashboardPlaceholderMenuStackClassName = cn(
  "inline-flex w-max max-w-[min(100vw-2rem,300px)] flex-col gap-2.5",
  dashboardPlaceholderSatoshi,
  "text-sm font-medium text-[#0b191f]",
);

/**
 * Radix menu content shell: no default popover chrome; chips provide their own surfaces.
 * Use with ContextMenuContent or DropdownMenuContent.
 */
export const dashboardPlaceholderFloatingMenuContentClassName = cn(
  "z-[200] border-0 bg-transparent p-0 shadow-none ring-0",
  "!overflow-visible",
);

/**
 * White bordered chip row — hover/highlight matches dashboard placeholder neutrals.
 */
export const dashboardPlaceholderMenuOptionChipClassName = cn(
  dashboardPlaceholderSatoshi,
  "relative flex w-full min-w-[12rem] cursor-pointer items-center gap-3 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2.5",
  "text-sm font-medium leading-snug text-[#0b191f] shadow-sm",
  "outline-none transition-[box-shadow,background-color,color] duration-100",
  "focus-visible:ring-2 focus-visible:ring-[#0b191f]/10 focus-visible:ring-offset-0",
  "focus:bg-white focus:text-[#0b191f] focus-visible:bg-[#f5f7f8] focus-visible:text-[#0b191f]",
  "data-[highlighted]:bg-[#f5f7f8] data-[highlighted]:text-[#0b191f] data-[highlighted]:shadow-md",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
);

export const dashboardPlaceholderMenuOptionIconClass =
  "size-4 shrink-0 stroke-[1.75] text-[#0b191f]";
