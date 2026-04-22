"use client";

import { memberAvatarBackground } from "@/lib/memberAvatar";
import type { Member } from "@/types/member";

export type KanbanAssigneeAvatarsProps = {
  assigneeUserIds: number[];
  memberByUserId: Map<number, Member>;
  /** Pixel size of each avatar circle (default matches kanban cards). */
  sizePx?: number;
  /** Board cards show dashed placeholder + label; list rows use a compact dash. */
  variant?: "card" | "row";
};

const MAX_VISIBLE = 3;

/**
 * Stacked assignee initials for kanban views (supports multiple assignees).
 */
export function KanbanAssigneeAvatars({
  assigneeUserIds,
  memberByUserId,
  sizePx = 24,
  variant = "card",
}: KanbanAssigneeAvatarsProps) {
  const ids = [...new Set(assigneeUserIds.filter((id) => Number.isFinite(id)))];
  const visible = ids.slice(0, MAX_VISIBLE);
  const overflow = ids.length - visible.length;
  const gap = Math.round(sizePx * 0.35);

  if (ids.length === 0) {
    if (variant === "row") {
      return (
        <span className="font-['Satoshi:Medium',sans-serif] truncate text-[12px] text-[#727d83]">—</span>
      );
    }
    return (
      <div className="flex min-w-0 max-w-full items-center gap-1.5">
        <div
          className="flex shrink-0 items-center justify-center rounded-[999px] border border-dashed border-[#cdd2d5] bg-[#fafbfc]"
          style={{ width: sizePx, height: sizePx }}
          title="Unassigned"
        >
          <span className="text-[10px] text-[#727d83]">—</span>
        </div>
        <span className="truncate font-['Satoshi:Medium',sans-serif] text-[11px] text-[#727d83]">
          Unassigned
        </span>
      </div>
    );
  }

  const missing = ids.some((id) => !memberByUserId.has(id));

  return (
    <div className="flex min-w-0 items-center" style={{ paddingRight: overflow > 0 ? gap : 0 }}>
      <div className="flex items-center" style={{ marginLeft: visible.length > 1 ? -gap : 0 }}>
        {visible.map((userId, index) => {
          const member = memberByUserId.get(userId);
          const z = visible.length - index;
          return (
            <div
              key={userId}
              className="content-stretch flex shrink-0 items-center justify-center rounded-[999px] border border-solid border-white"
              style={{
                width: sizePx,
                height: sizePx,
                marginLeft: index === 0 ? 0 : -gap,
                zIndex: z,
                backgroundColor: member ? memberAvatarBackground(member.userId) : "#e4e8eb",
              }}
              title={member?.name ?? `User #${userId}`}
            >
              <span className="font-['Satoshi:Medium',sans-serif] text-[9px] leading-[0.4] text-white">
                {member?.initials ?? "?"}
              </span>
            </div>
          );
        })}
        {overflow > 0 ? (
          <div
            className="content-stretch flex shrink-0 items-center justify-center rounded-[999px] border border-solid border-white bg-[#f5f7f8]"
            style={{
              width: sizePx,
              height: sizePx,
              marginLeft: -gap,
              zIndex: visible.length + 1,
            }}
            title={`${overflow} more assignee${overflow === 1 ? "" : "s"}`}
          >
            <span className="font-['Satoshi:Medium',sans-serif] text-[8px] leading-none text-[#727d83]">
              +{overflow}
            </span>
          </div>
        ) : null}
      </div>
      {missing ? (
        <span className="sr-only">One or more assignees are not in the project member list.</span>
      ) : null}
    </div>
  );
}
