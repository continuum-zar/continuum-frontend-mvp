import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useAddMember, useProjectMembers } from "@/api/hooks";
import { useAssignMemberRole, useProjectRoles } from "@/api/rbacHooks";
import { memberAvatarBackground } from "@/lib/memberAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import type { RbacRole } from "@/types/rbac";

type ProjectSettingsMembersTabProps = {
  projectId: number;
  /** Whether the caller may invite members (members.invite). */
  canInvite?: boolean;
  /** Whether the caller may change member roles (members.assign_role). */
  canAssignRole?: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Project Owner",
  admin: "Admin",
  project_manager: "Project Manager",
  developer: "Developer",
  view_only: "View Only",
  contractor: "Contractor",
  client: "View Only",
};

function roleLabel(role: string | null | undefined): string {
  if (!role) return "Member";
  return ROLE_LABELS[role.toLowerCase()] ?? role;
}

export function ProjectSettingsMembersTab({
  projectId,
  canInvite = true,
  canAssignRole = true,
}: ProjectSettingsMembersTabProps) {
  const membersQuery = useProjectMembers(projectId);
  const rolesQuery = useProjectRoles(projectId);
  const addMember = useAddMember(projectId);
  const assignRole = useAssignMemberRole(projectId);

  const [email, setEmail] = useState("");
  const [inviteRoleKey, setInviteRoleKey] = useState("developer");

  // Assignable roles, owner excluded (ownership is transferred, not assigned).
  const assignableRoles = useMemo<RbacRole[]>(
    () => (rolesQuery.data ?? []).filter((r) => r.default_key !== "owner"),
    [rolesQuery.data],
  );

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      await addMember.mutateAsync({ email: trimmed, role: inviteRoleKey });
      setEmail("");
    } catch {
      // toast handled in hook
    }
  };

  const members = membersQuery.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[737px] flex-col gap-6 px-6 py-6">
      {canInvite && (
        <div className="flex w-full items-stretch gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleInvite();
            }}
            placeholder="Email address"
            className="h-11 flex-1 rounded-[8px] border border-border bg-card px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="relative flex-1">
            <select
              value={inviteRoleKey}
              onChange={(e) => setInviteRoleKey(e.target.value)}
              className="h-11 w-full appearance-none rounded-[8px] border border-border bg-card px-4 pr-10 font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground focus:border-primary focus:outline-none"
            >
              {assignableRoles.map((r) => (
                <option key={r.id} value={r.default_key ?? r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button
            type="button"
            onClick={() => void handleInvite()}
            disabled={!email.trim() || addMember.isPending}
            className="inline-flex h-11 items-center justify-center rounded-[8px] px-5 font-['Satoshi',sans-serif] text-[14px] font-bold text-white transition-opacity disabled:opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(151.87deg, rgb(36, 181, 248) 0%, rgb(85, 33, 254) 160%)",
            }}
          >
            {addMember.isPending ? "Inviting…" : "Invite"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground">
          Who has access
        </p>

        {membersQuery.isLoading ? (
          <p className="py-6 text-center text-[14px] text-muted-foreground">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-muted-foreground">No members yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((member) => {
              const primary = member.displayName || member.name || member.email;
              const secondary =
                member.displayName && member.email ? member.email : member.email;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-[8px] pr-2"
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.333px] border-white text-[12px] font-medium text-white"
                    style={{ backgroundColor: memberAvatarBackground(member.userId) }}
                  >
                    {member.initials}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col px-2 py-1.5">
                    <p className="truncate font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground">
                      {primary}
                    </p>
                    <p className="truncate font-['Satoshi',sans-serif] text-[12px] font-medium text-muted-foreground">
                      {secondary}
                    </p>
                  </div>

                  {canAssignRole && assignableRoles.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-[16px] bg-muted px-3 py-1 font-['Satoshi',sans-serif] text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                        >
                          {roleLabel(member.role)}
                          <ChevronDown className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        {assignableRoles.map((r) => (
                          <DropdownMenuItem
                            key={r.id}
                            disabled={assignRole.isPending}
                            onSelect={() =>
                              assignRole.mutate({ userId: member.userId, roleId: r.id })
                            }
                          >
                            {r.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span
                      className={cn(
                        "rounded-[16px] bg-muted px-3 py-1 font-['Satoshi',sans-serif] text-[14px] font-medium text-muted-foreground",
                      )}
                    >
                      {roleLabel(member.role)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
