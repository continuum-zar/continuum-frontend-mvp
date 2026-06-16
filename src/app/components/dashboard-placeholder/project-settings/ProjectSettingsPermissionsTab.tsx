import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { usePermissionCatalog, useUpdateRole } from "@/api/rbacHooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import type { CatalogSection, RbacRole } from "@/types/rbac";

import { PermissionSections } from "./PermissionSections";
import { PERMISSION_CATEGORIES, sortRoles, type PermissionCategory } from "./rbacCatalog";

type ProjectSettingsPermissionsTabProps = {
  projectId: number;
  roles: RbacRole[];
  selectedRoleId: number | null;
  onSelectRole: (roleId: number) => void;
  /** Whether the caller may edit role bundles (roles.edit). */
  canEdit?: boolean;
};

/**
 * Permissions tab — the same per-role permission editing as the Roles tab, but
 * organised into category tabs (Project / Milestones / Tasks / Timesheet &
 * Invoice). Shares the selected-role state with the Roles tab via props.
 */
export function ProjectSettingsPermissionsTab({
  projectId,
  roles,
  selectedRoleId,
  onSelectRole,
  canEdit = true,
}: ProjectSettingsPermissionsTabProps) {
  const catalogQuery = usePermissionCatalog();
  const updateRole = useUpdateRole(projectId);
  const [category, setCategory] = useState<PermissionCategory>("project");

  const ordered = useMemo(() => sortRoles(roles), [roles]);
  const selectedRole = ordered.find((r) => r.id === selectedRoleId) ?? ordered[0] ?? null;
  const enabledKeys = useMemo(
    () => new Set(selectedRole?.effective_permissions ?? []),
    [selectedRole],
  );
  const readOnly = !canEdit || !!selectedRole?.is_system;

  const activeCategory = PERMISSION_CATEGORIES.find((c) => c.key === category)!;
  const sectionsForCategory = useMemo<CatalogSection[]>(() => {
    const all = catalogQuery.data?.sections ?? [];
    const allow = new Set(activeCategory.sections);
    return all.filter((s) => allow.has(s.section));
  }, [catalogQuery.data, activeCategory]);

  const handleToggle = (key: string, next: boolean) => {
    if (!selectedRole || readOnly) return;
    const nextKeys = new Set(selectedRole.effective_permissions);
    if (next) nextKeys.add(key);
    else nextKeys.delete(key);
    if (nextKeys.size === 0) return;
    updateRole.mutate({ roleId: selectedRole.id, body: { permissions: Array.from(nextKeys) } });
  };

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-8 px-6 py-6">
      {/* Category tabs + role context picker */}
      <div className="flex items-center justify-between gap-4 border-b border-[#ebedee]">
        <div className="flex flex-wrap items-center gap-1">
          {PERMISSION_CATEGORIES.map((cat) => {
            const active = cat.key === category;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={cn(
                  "relative -mb-px px-3 py-2 font-['Satoshi',sans-serif] text-[16px] font-medium transition-colors",
                  active
                    ? "text-[#0b191f] after:absolute after:inset-x-3 after:-bottom-px after:h-[2px] after:rounded-full after:bg-[#0b191f]"
                    : "text-[#606d76] hover:text-[#0b191f]",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {selectedRole && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mb-2 flex shrink-0 items-center gap-1.5 rounded-[8px] border border-[#e9e9e9] bg-white px-3 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] hover:bg-[#f5f7f8]"
              >
                <span className="text-[#9aa4ab]">Role:</span> {selectedRole.name}
                <ChevronDown className="size-4 text-[#606d76]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {ordered.map((r) => (
                <DropdownMenuItem key={r.id} onSelect={() => onSelectRole(r.id)}>
                  {r.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {selectedRole?.is_system && (
        <div className="rounded-[8px] bg-[#f0f3f5] px-4 py-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
          The Project Owner role has every permission and cannot be edited.
        </div>
      )}

      {catalogQuery.data ? (
        <PermissionSections
          sections={sectionsForCategory}
          enabledKeys={enabledKeys}
          readOnly={readOnly}
          onToggle={handleToggle}
        />
      ) : (
        <p className="py-6 text-center text-[14px] text-[#606d76]">Loading permissions…</p>
      )}
    </div>
  );
}
