/**
 * Debounced wrapper around `usePatchMigrationMapping`.
 *
 * The architecture doc (§3.7.a) calls for "debounced 400 ms" PATCHes from
 * the preview screen's mapping panels so the server is the source of truth
 * for warning recomputation while the user is mid-edit. This hook batches
 * the most recent patch and fires it after the debounce window elapses,
 * collapsing rapid edits to the same key into a single PATCH.
 *
 * Caller pattern:
 *   const { schedule } = useDebouncedMappingPatch(jobId);
 *   onChange(value) {
 *     schedule({ status_map: { [raw]: value } });
 *   }
 *
 * Patches are merged shallowly client-side as well, so a sequence of
 *   schedule({ status_map: { Awaiting: 'in_progress' } });
 *   schedule({ skip_done: true });
 * fires ONE PATCH with both fields. The backend then merges into
 * `mapping_overrides` (also shallow).
 */

import { useCallback, useEffect, useRef } from "react";

import { usePatchMigrationMapping } from "@/api/migrations";
import type { MigrationMappingPatch } from "@/types/migration";

const DEBOUNCE_MS = 400;

/** Shallow-merge two patches: later values win; non-object values replace. */
function mergePatch(
    base: MigrationMappingPatch,
    incoming: MigrationMappingPatch,
): MigrationMappingPatch {
    const merged: MigrationMappingPatch = { ...base };
    if (incoming.status_map) {
        merged.status_map = { ...(base.status_map ?? {}), ...incoming.status_map };
    }
    if (incoming.priority_map) {
        merged.priority_map = { ...(base.priority_map ?? {}), ...incoming.priority_map };
    }
    if (incoming.user_map) {
        merged.user_map = { ...(base.user_map ?? {}), ...incoming.user_map };
    }
    if (incoming.skip_done !== undefined) {
        merged.skip_done = incoming.skip_done;
    }
    return merged;
}

export function useDebouncedMappingPatch(jobId: number | string | undefined) {
    const mutation = usePatchMigrationMapping(jobId);
    const pendingRef = useRef<MigrationMappingPatch>({});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flush = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const patch = pendingRef.current;
        pendingRef.current = {};
        if (Object.keys(patch).length === 0) return;
        mutation.mutate(patch);
    }, [mutation]);

    const schedule = useCallback(
        (patch: MigrationMappingPatch) => {
            pendingRef.current = mergePatch(pendingRef.current, patch);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(flush, DEBOUNCE_MS);
        },
        [flush],
    );

    // Flush on unmount so an in-flight edit isn't lost when the user
    // navigates away mid-debounce.
    useEffect(() => {
        return () => {
            if (
                timerRef.current === null &&
                Object.keys(pendingRef.current).length === 0
            ) {
                return;
            }
            flush();
        };
    }, [flush]);

    return {
        schedule,
        flush,
        isPending: mutation.isPending,
    };
}
