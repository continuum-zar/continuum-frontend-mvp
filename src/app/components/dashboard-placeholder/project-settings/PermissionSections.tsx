import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/app/components/ui/utils";
import type { CatalogSection } from "@/types/rbac";

import { SECTION_SUBTITLES } from "./rbacCatalog";

/**
 * Permission toggle sized to the design (40×22 track, 18px thumb). The shared
 * ui/switch bakes its thumb travel to a 32px track, so resizing it leaves the
 * thumb short of the right edge — we use the Radix primitive directly here and
 * match the travel to the wider track (2px inset → 18px travel).
 */
function PermissionToggle({
  checked,
  disabled,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={cn(
        "inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full p-[2px] outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[#1466ff]/40 disabled:cursor-not-allowed disabled:opacity-60",
        "data-[state=checked]:bg-[#1466ff] data-[state=unchecked]:bg-[#e3e6e9]",
      )}
    >
      <SwitchPrimitive.Thumb className="block size-[18px] rounded-full bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.15)] transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}

type PermissionSectionsProps = {
  /** Catalog sections to render (already filtered to the active category/role). */
  sections: CatalogSection[];
  /** Permission keys currently enabled for the role being edited. */
  enabledKeys: Set<string>;
  /** Read-only mode (e.g. the immutable Project Owner role). */
  readOnly?: boolean;
  onToggle: (permissionKey: string, next: boolean) => void;
};

/**
 * Renders grouped permission rows with toggles — the shared body of both the
 * Roles and Permissions tabs. Matches the Figma "Permissions" design: section
 * title + subtitle, then a list of `description ........ [toggle]` rows.
 */
export function PermissionSections({
  sections,
  enabledKeys,
  readOnly = false,
  onToggle,
}: PermissionSectionsProps) {
  return (
    <div className="flex w-full flex-col gap-10">
      {sections.map((section) => (
        <section key={section.section} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-['Satoshi',sans-serif] text-[22px] font-medium tracking-[-0.22px] text-[#0b191f]">
              {section.section}
            </h3>
            {SECTION_SUBTITLES[section.section] && (
              <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#9aa4ab]">
                {SECTION_SUBTITLES[section.section]}
              </p>
            )}
          </div>
          <div className="flex flex-col">
            {section.permissions.map((perm) => {
              const checked = enabledKeys.has(perm.key);
              return (
                <div
                  key={perm.key}
                  className="flex items-center justify-between gap-6 py-[10px]"
                >
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium leading-snug text-[#0b191f]">
                    {perm.description}
                  </p>
                  <PermissionToggle
                    checked={checked}
                    disabled={readOnly}
                    onCheckedChange={(next) => onToggle(perm.key, next)}
                    label={perm.description}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
