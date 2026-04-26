import type { Milestone } from '@/types/milestone';

function milestoneIdNum(m: Milestone): number {
    const n = Number(m.id);
    return Number.isFinite(n) ? n : 0;
}

/** Parse UI `date` (formatted label or ISO) for nav ordering; invalid → NaN. */
function navDueTimeMs(m: Milestone): number {
    return new Date(m.date).getTime();
}

/**
 * Sprint nav / default board: milestones with a parseable due date first (chronological);
 * undated milestones follow in API/planned order (stable numeric id), not alphabetical.
 */
export function sortMilestonesForNav(list: Milestone[]): Milestone[] {
    return [...list].sort((a, b) => {
        const tA = navDueTimeMs(a);
        const tB = navDueTimeMs(b);
        if (Number.isNaN(tA) && Number.isNaN(tB)) {
            return milestoneIdNum(a) - milestoneIdNum(b);
        }
        if (Number.isNaN(tA)) return 1;
        if (Number.isNaN(tB)) return -1;
        if (tA !== tB) return tA - tB;
        return milestoneIdNum(a) - milestoneIdNum(b);
    });
}

function milestoneDueTimeMs(m: Milestone): number {
    if (!m.dueDateIso) return Number.POSITIVE_INFINITY;
    const raw = m.dueDateIso.includes('T') ? m.dueDateIso : `${m.dueDateIso}T12:00:00`;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * Overview timeline: earliest due date first; when due dates tie or are missing,
 * preserve planned/creation order (id), not name order.
 */
export function sortMilestonesForTimeline(list: Milestone[]): Milestone[] {
    return [...list].sort((a, b) => {
        const ta = milestoneDueTimeMs(a);
        const tb = milestoneDueTimeMs(b);
        if (ta !== tb) return ta - tb;
        return milestoneIdNum(a) - milestoneIdNum(b);
    });
}
