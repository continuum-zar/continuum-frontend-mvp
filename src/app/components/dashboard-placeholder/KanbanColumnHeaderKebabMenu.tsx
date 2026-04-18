"use client";

import { Trash2 } from "lucide-react";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import {
  dashboardPlaceholderFloatingMenuContentClassName,
  dashboardPlaceholderMenuOptionChipClassName,
  dashboardPlaceholderMenuOptionIconClass,
  dashboardPlaceholderMenuStackClassName,
} from "./dashboardPlaceholderMenuChips";
import type { KanbanColumnConfig } from "./kanbanBoardTypes";
import { isDefaultKanbanColumn } from "./kanbanBoardTypes";

const imgVector10 = mcpAsset("0d58a9e0-9d27-4eb3-ad07-b2ad64a15f10");
/** Plus icon — same asset as To-do column “Create task” on the board (`GetStartedKanbanLive`). */
const imgVector11 = mcpAsset("4912f83a-d378-4c38-9bf2-ce38aa20cc19");

/** Same gap as `KanbanTaskCardContextMenu` between card edge and menu (`GAP`). */
const KANBAN_FLOATING_MENU_SIDE_OFFSET_PX = 10;

export type KanbanColumnHeaderKebabMenuProps = {
  column: KanbanColumnConfig;
  onAddList: () => void;
  /** Invoked when the user chooses “Delete list” (only shown for non-default columns). */
  onRequestDeleteList?: () => void;
};

export function KanbanColumnHeaderKebabMenu({
  column,
  onAddList,
  onRequestDeleteList,
}: KanbanColumnHeaderKebabMenuProps) {
  const showDelete = !isDefaultKanbanColumn(column) && onRequestDeleteList != null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "content-stretch flex cursor-pointer flex-col items-start overflow-clip rounded-[4px] border-0 bg-transparent px-[4px] py-[11px] outline-none shrink-0 w-[24px]",
            "focus-visible:ring-2 focus-visible:ring-[#0b191f]/10 focus-visible:ring-offset-0",
          )}
          aria-haspopup="menu"
          aria-label={`Column options, ${column.title}`}
        >
          <div className="relative h-[2px] w-[16px] shrink-0">
            <div className="absolute inset-[-50%_-6.25%]">
              <img alt="" className="block max-w-none size-full" src={imgVector10} />
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={KANBAN_FLOATING_MENU_SIDE_OFFSET_PX}
        avoidCollisions={false}
        className={cn(
          dashboardPlaceholderFloatingMenuContentClassName,
          "max-h-(--radix-dropdown-menu-content-available-height) min-w-0 origin-(--radix-dropdown-menu-content-transform-origin)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className={dashboardPlaceholderMenuStackClassName}>
          <DropdownMenuItem
            className={dashboardPlaceholderMenuOptionChipClassName}
            onSelect={() => {
              onAddList();
            }}
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center" aria-hidden>
              <span className="relative size-[14px] shrink-0">
                <span className="absolute inset-[-5.36%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector11} />
                </span>
              </span>
            </span>
            Add list
          </DropdownMenuItem>
          {showDelete ? (
            <DropdownMenuItem
              className={dashboardPlaceholderMenuOptionChipClassName}
              onSelect={() => {
                onRequestDeleteList?.();
              }}
            >
              <Trash2 className={dashboardPlaceholderMenuOptionIconClass} aria-hidden />
              Delete list
            </DropdownMenuItem>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
