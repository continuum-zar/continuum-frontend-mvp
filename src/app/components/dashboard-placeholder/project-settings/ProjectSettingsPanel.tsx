"use client";

import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";

import {
  useMyProjectPermissions,
  useProjectRoles,
} from "@/api/rbacHooks";
import { Dialog, DialogOverlay, DialogPortal } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";

import { ProjectSettingsMembersTab } from "./ProjectSettingsMembersTab";
import { ProjectSettingsPermissionsTab } from "./ProjectSettingsPermissionsTab";
import { ProjectSettingsProjectTab } from "./ProjectSettingsProjectTab";
import { ProjectSettingsRolesTab } from "./ProjectSettingsRolesTab";
import { sortRoles } from "./rbacCatalog";

type SettingsTab = "project" | "members" | "roles" | "permissions";

type ProjectSettingsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectName: string;
  initialName: string;
  initialDescription: string;
  initialStartDateIso: string | null;
  initialDueDateIso: string | null;
};

const TAB_TITLES: Record<SettingsTab, string> = {
  project: "Project",
  members: "Members",
  roles: "Roles",
  permissions: "Permissions",
};

export function ProjectSettingsPanel({
  open,
  onOpenChange,
  projectId,
  projectName,
  initialName,
  initialDescription,
  initialStartDateIso,
  initialDueDateIso,
}: ProjectSettingsPanelProps) {
  const permissionsQuery = useMyProjectPermissions(projectId, { enabled: open });
  const rolesQuery = useProjectRoles(projectId, { enabled: open });

  const perms = useMemo(
    () => new Set(permissionsQuery.data?.permissions ?? []),
    [permissionsQuery.data],
  );
  const isOwner = permissionsQuery.data?.is_owner ?? false;
  const can = (key: string) => isOwner || perms.has(key);

  // While permissions are loading we optimistically show all tabs; the content
  // itself degrades gracefully (read-only / empty) if a grant is missing.
  const permsLoading = permissionsQuery.isLoading;
  const visibleTabs = useMemo<SettingsTab[]>(() => {
    const tabs: SettingsTab[] = [];
    if (permsLoading || can("project.edit.view")) tabs.push("project");
    tabs.push("members"); // teammates are always visible (§project.team.view)
    if (permsLoading || can("roles.view")) tabs.push("roles");
    if (permsLoading || can("roles.view")) tabs.push("permissions");
    return tabs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permsLoading, isOwner, permissionsQuery.data]);

  const [tab, setTab] = useState<SettingsTab>("project");
  const [search, setSearch] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Keep the active tab valid as visibility resolves.
  useEffect(() => {
    if (!visibleTabs.includes(tab)) setTab(visibleTabs[0] ?? "members");
  }, [visibleTabs, tab]);

  // Default the role selector to the first non-owner role once roles load.
  useEffect(() => {
    if (selectedRoleId != null) return;
    const ordered = sortRoles(rolesQuery.data ?? []);
    const firstEditable = ordered.find((r) => !r.is_system) ?? ordered[0];
    if (firstEditable) setSelectedRoleId(firstEditable.id);
  }, [rolesQuery.data, selectedRoleId]);

  // Reset transient state when the panel closes.
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const navItems = visibleTabs.filter((t) =>
    search.trim() ? TAB_TITLES[t].toLowerCase().includes(search.trim().toLowerCase()) : true,
  );

  const roles = rolesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[90] bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] flex h-[min(894px,92vh)] w-[min(1344px,95vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Project settings</DialogPrimitive.Title>

          {/* Sidebar */}
          <div className="flex h-full w-[249px] shrink-0 flex-col justify-between border-r border-[#ebedee] bg-[#edf0f3] px-4 pb-4 pt-6">
            <div className="flex w-full flex-col gap-4">
              <div className="flex h-10 w-full items-center gap-2 rounded-[999px] border border-[rgba(96,109,118,0.2)] bg-[#edf0f3] px-4">
                <Search className="size-4 shrink-0 text-[#606d76]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76] placeholder:text-[#606d76] focus:outline-none"
                />
              </div>
              <nav className="flex w-full flex-col">
                {navItems.map((item) => {
                  const active = item === tab;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTab(item)}
                      className={cn(
                        "flex h-10 w-full items-center rounded-[8px] px-4 text-left font-['Satoshi',sans-serif] text-[16px] font-medium transition-colors",
                        active
                          ? "border border-[#ededed] bg-white text-[#0b191f] shadow-[0px_1px_0.5px_rgba(14,14,34,0.03)]"
                          : "text-[#606d76] hover:text-[#0b191f]",
                      )}
                    >
                      {TAB_TITLES[item]}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="h-px w-full bg-[rgba(96,109,118,0.2)]" />
              <p className="truncate font-['Satoshi',sans-serif] text-[16px] font-medium text-[#252014]">
                {projectName || "Project"}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-full min-w-px flex-1 flex-col">
            <div className="sticky top-0 z-[2] flex h-16 shrink-0 items-center justify-between border-b border-[#ebedee] bg-white px-4">
              <p className="font-['Satoshi',sans-serif] text-[20px] font-medium text-[#0b191f]">
                {TAB_TITLES[tab]}
              </p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-9 items-center justify-center rounded-full text-[#0b191f] transition-colors hover:bg-[#f0f3f5]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === "project" && (
                <ProjectSettingsProjectTab
                  projectId={projectId}
                  initialName={initialName}
                  initialDescription={initialDescription}
                  initialStartDateIso={initialStartDateIso}
                  initialDueDateIso={initialDueDateIso}
                  canEdit={isOwner || can("project.edit.view")}
                  canDelete={isOwner || can("project.delete")}
                  onClose={() => onOpenChange(false)}
                />
              )}
              {tab === "members" && (
                <ProjectSettingsMembersTab
                  projectId={projectId}
                  canInvite={isOwner || can("members.invite")}
                  canAssignRole={isOwner || can("members.assign_role")}
                />
              )}
              {tab === "roles" && (
                <ProjectSettingsRolesTab
                  projectId={projectId}
                  roles={roles}
                  selectedRoleId={selectedRoleId}
                  onSelectRole={setSelectedRoleId}
                  canEdit={isOwner || can("roles.edit")}
                />
              )}
              {tab === "permissions" && (
                <ProjectSettingsPermissionsTab
                  projectId={projectId}
                  roles={roles}
                  selectedRoleId={selectedRoleId}
                  onSelectRole={setSelectedRoleId}
                  canEdit={isOwner || can("roles.edit")}
                />
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
