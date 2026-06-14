/**
 * RBAC types — mirror the backend contract (continuum-backend `app/schemas/rbac.py`
 * and `app/rbac/catalog.py`). See docs/RBAC_Implementation_Plan.md in the backend.
 */

/** One permission in the catalog. `parent` encodes the §8.2 dependency gate. */
export interface PermissionMeta {
    key: string;
    label: string;
    description: string;
    section: string;
    parent: string | null;
}

export interface CatalogSection {
    section: string;
    permissions: PermissionMeta[];
}

/** GET /rbac/permissions */
export interface PermissionCatalog {
    total: number;
    sections: CatalogSection[];
}

/** A project role (RoleResponse). */
export interface RbacRole {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
    /** "owner" | "admin" | "project_manager" | "developer" | "view_only" | "contractor" | null (custom). */
    default_key: string | null;
    is_default: boolean;
    /** The immutable Project Owner role — all permissions, cannot be edited/deleted. */
    is_system: boolean;
    /** Base bundle permission keys. */
    permissions: string[];
    /** Per-role override annotations (key -> enabled). */
    overrides: Record<string, boolean>;
    /** Base bundle with overrides applied — what the UI should reflect as "on". */
    effective_permissions: string[];
}

/** GET/POST/DELETE /projects/{id}/members/{userId}/roles */
export interface MemberRolesResponse {
    user_id: number;
    roles: RbacRole[];
}

/** GET /projects/{id}/me/permissions (and /members/{userId}/permissions) */
export interface EffectivePermissions {
    project_id: number;
    user_id: number;
    is_owner: boolean;
    permissions: string[];
}
