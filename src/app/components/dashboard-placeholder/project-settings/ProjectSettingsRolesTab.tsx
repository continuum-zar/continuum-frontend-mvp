import { useMemo } from "react";

import { usePermissionCatalog, useResetRole, useUpdateRole } from "@/api/rbacHooks";
import { cn } from "@/app/components/ui/utils";
import type { RbacRole } from "@/types/rbac";

import { PermissionSections } from "./PermissionSections";
import { sortRoles } from "./rbacCatalog";

type ProjectSettingsRolesTabProps = {
  projectId: number;
  roles: RbacRole[];
  selectedRoleId: number | null;
  onSelectRole: (roleId: number) => void;
  /** Whether the caller may edit role bundles (roles.edit). */
  canEdit?: boolean;
};

export function ProjectSettingsRolesTab({
  projectId,
  roles,
  selectedRoleId,
  onSelectRole,
  canEdit = true,
}: ProjectSettingsRolesTabProps) {
  const catalogQuery = usePermissionCatalog();
  const updateRole = useUpdateRole(projectId);
  const resetRole = useResetRole(projectId);

  const ordered = useMemo(() => sortRoles(roles), [roles]);
  const selectedRole = ordered.find((r) => r.id === selectedRoleId) ?? ordered[0] ?? null;
  const enabledKeys = useMemo(
    () => new Set(selectedRole?.effective_permissions ?? []),
    [selectedRole],
  );

  const readOnly = !canEdit || !!selectedRole?.is_system;

  const handleToggle = (key: string, next: boolean) => {
    if (!selectedRole || readOnly) return;
    const nextKeys = new Set(selectedRole.effective_permissions);
    if (next) nextKeys.add(key);
    else nextKeys.delete(key);
    if (nextKeys.size === 0) return; // a role must keep at least one permission
    updateRole.mutate({ roleId: selectedRole.id, body: { permissions: Array.from(nextKeys) } });
  };

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-8 px-6 py-6">
      {/* Role selector tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {ordered.map((role) => {
          const active = role.id === selectedRole?.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={cn(
                "relative -mb-px px-3 py-2 font-['Satoshi',sans-serif] text-[16px] font-medium transition-colors",
                active
                  ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-[2px] after:rounded-full after:bg-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {role.name}
            </button>
          );
        })}
      </div>

      {selectedRole && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-['Satoshi',sans-serif] text-[20px] font-medium text-foreground">
              {selectedRole.name}
            </h2>
            {selectedRole.description && (
              <p className="max-w-[560px] font-['Satoshi',sans-serif] text-[14px] font-medium text-muted-foreground">
                {selectedRole.description}
              </p>
            )}
          </div>
          {canEdit && selectedRole.is_default && !selectedRole.is_system && (
            <button
              type="button"
              disabled={resetRole.isPending}
              onClick={() => resetRole.mutate(selectedRole.id)}
              className="shrink-0 rounded-[8px] border border-border bg-card px-4 py-2 font-['Satoshi',sans-serif] text-[14px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              {resetRole.isPending ? "Resetting…" : "Reset to default"}
            </button>
          )}
        </div>
      )}

      {selectedRole?.is_system && (
        <div className="rounded-[8px] bg-muted px-4 py-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-muted-foreground">
          The Project Owner role has every permission and cannot be edited.
        </div>
      )}

      {catalogQuery.data ? (
        <PermissionSections
          sections={catalogQuery.data.sections}
          enabledKeys={enabledKeys}
          readOnly={readOnly}
          onToggle={handleToggle}
        />
      ) : (
        <p className="py-6 text-center text-[14px] text-muted-foreground">Loading permissions…</p>
      )}
    </div>
  );
}
