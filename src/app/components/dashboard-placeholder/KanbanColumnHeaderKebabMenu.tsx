"use client";

import { Milestone, PanelsTopLeft, Trash2 } from "lucide-react";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  /** Other lists on the board to bulk-move tasks into (same milestone scope). */
  moveTasksTargetColumns?: { id: string; label: string }[];
  /** Move every task in this column to the given list/column. */
  onMoveAllTasksToColumn?: (targetColumnId: string) => void;
  /** Number of tasks in this column (hide bulk move when zero). */
  tasksInColumnCount?: number;
  /** Disable bulk move controls while a move is running (any column). */
  isMoveTasksPending?: boolean;
  /** Milestone targets for bulk-assign (omit when project has no milestones). */
  moveTasksToMilestoneOptions?: {
    milestoneId: string | null;
    label: string;
    disabled?: boolean;
  }[];
  /** Assign every task in this column to the milestone (`null` = no milestone). */
  onMoveAllTasksToMilestone?: (milestoneId: string | null) => void;
};

const listScrollClassName = cn(
  "flex max-h-[220px] flex-col gap-2 overflow-y-auto overflow-x-visible",
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
);

const subShellClassName = cn(
  dashboardPlaceholderMenuStackClassName,
  "min-w-[11rem] gap-2",
  "!bg-transparent !border-0 !p-0 !shadow-none !rounded-none !overflow-visible",
);

export function KanbanColumnHeaderKebabMenu({
  column,
  onAddList,
  onRequestDeleteList,
  moveTasksTargetColumns,
  onMoveAllTasksToColumn,
  tasksInColumnCount = 0,
  isMoveTasksPending = false,
  moveTasksToMilestoneOptions,
  onMoveAllTasksToMilestone,
}: KanbanColumnHeaderKebabMenuProps) {
  const showDelete = !isDefaultKanbanColumn(column) && onRequestDeleteList != null;
  const canBulkMove =
    typeof onMoveAllTasksToColumn === "function" &&
    (moveTasksTargetColumns?.length ?? 0) > 0 &&
    tasksInColumnCount > 0;
  const canBulkMilestone =
    typeof onMoveAllTasksToMilestone === "function" &&
    tasksInColumnCount > 0 &&
    (moveTasksToMilestoneOptions ?? []).some((o) => !o.disabled);

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
          {canBulkMove ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isMoveTasksPending}
                aria-label={`Move all tasks in ${column.title} to another list`}
                className={cn(
                  dashboardPlaceholderMenuOptionChipClassName,
                  "data-[state=open]:bg-[#f5f7f8] data-[state=open]:text-[#0b191f] data-[state=open]:shadow-md",
                  isMoveTasksPending && "pointer-events-none opacity-50",
                )}
              >
                <PanelsTopLeft
                  className={dashboardPlaceholderMenuOptionIconClass}
                  aria-hidden
                />
                Move tasks
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={8}
                className={cn(
                  subShellClassName,
                  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                )}
              >
                <div className={listScrollClassName}>
                  {(moveTasksTargetColumns ?? []).map(({ id, label }) => (
                    <DropdownMenuItem
                      key={id}
                      className={dashboardPlaceholderMenuOptionChipClassName}
                      disabled={isMoveTasksPending}
                      aria-label={`Move all tasks in this list to ${label}`}
                      onSelect={() => {
                        if (!isMoveTasksPending) onMoveAllTasksToColumn?.(id);
                      }}
                    >
                      <span className="truncate">{label}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}
          {canBulkMilestone ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isMoveTasksPending}
                aria-label={`Move all tasks in ${column.title} to another milestone`}
                className={cn(
                  dashboardPlaceholderMenuOptionChipClassName,
                  "data-[state=open]:bg-[#f5f7f8] data-[state=open]:text-[#0b191f] data-[state=open]:shadow-md",
                  isMoveTasksPending && "pointer-events-none opacity-50",
                )}
              >
                <Milestone
                  className={dashboardPlaceholderMenuOptionIconClass}
                  aria-hidden
                />
                Move tasks to milestone…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={8}
                className={cn(
                  subShellClassName,
                  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                )}
              >
                <div className={listScrollClassName}>
                  {(moveTasksToMilestoneOptions ?? []).map((opt) => (
                    <DropdownMenuItem
                      key={opt.milestoneId ?? "__none__"}
                      className={dashboardPlaceholderMenuOptionChipClassName}
                      disabled={isMoveTasksPending || opt.disabled}
                      aria-label={
                        opt.milestoneId === null
                          ? "Assign all tasks in this list to no milestone"
                          : `Assign all tasks in this list to milestone ${opt.label}`
                      }
                      onSelect={() => {
                        if (!isMoveTasksPending && !opt.disabled) {
                          onMoveAllTasksToMilestone?.(opt.milestoneId);
                        }
                      }}
                    >
                      <span className="truncate">{opt.label}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}
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
