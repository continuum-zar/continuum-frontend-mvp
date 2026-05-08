import { Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/app/components/ui/dialog';
import { cn } from '@/app/components/ui/utils';
import type { MilestoneDiffSection } from '@/lib/plannerPlanDiff';

export type PlannerRefinementDiffModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sections: MilestoneDiffSection[];
    isApplying: boolean;
    onConfirm: () => void;
};

function changeBadgeClass(change: MilestoneDiffSection['change'] | MilestoneDiffSection['tasks'][0]['change']) {
    switch (change) {
        case 'added':
            return 'bg-emerald-50 text-emerald-800 border-emerald-200';
        case 'removed':
            return 'bg-red-50 text-red-800 border-red-200';
        case 'modified':
            return 'bg-amber-50 text-amber-900 border-amber-200';
        default:
            return 'bg-slate-50 text-slate-600 border-slate-200';
    }
}

export function PlannerRefinementDiffModal({
    open,
    onOpenChange,
    sections,
    isApplying,
    onConfirm,
}: PlannerRefinementDiffModalProps) {
    const hasVisibleChange = sections.some(
        (s) =>
            s.change !== 'unchanged' ||
            s.tasks.some((t) => t.change !== 'unchanged'),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto font-['Satoshi',sans-serif]">
                <DialogHeader>
                    <DialogTitle className="text-[#0b191f]">Review proposed plan changes</DialogTitle>
                    <p className="text-sm font-medium text-[#727d83]">
                        Locked tasks and milestones (in progress, done, or completed work) are not modified on
                        the server. The list below highlights additions, removals, and edits.
                    </p>
                </DialogHeader>

                {!hasVisibleChange ? (
                    <p className="text-sm text-[#606d76]">No differences detected vs. the loaded baseline.</p>
                ) : (
                    <ul className="space-y-4 text-sm">
                        {sections.map((sec) => {
                            const tasksInteresting = sec.tasks.filter((t) => t.change !== 'unchanged');
                            if (sec.change === 'unchanged' && tasksInteresting.length === 0) return null;
                            return (
                                <li key={sec.key} className="rounded-lg border border-[#ebedee] bg-white p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                'rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
                                                changeBadgeClass(sec.change),
                                            )}
                                        >
                                            {sec.change}
                                        </span>
                                        <span className="font-semibold text-[#0b191f]">{sec.name}</span>
                                        {sec.milestoneId != null && (
                                            <span className="text-xs text-[#727d83]">milestone #{sec.milestoneId}</span>
                                        )}
                                        {sec.milestoneLocked && (
                                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                                Locked milestone
                                            </span>
                                        )}
                                    </div>
                                    {tasksInteresting.length > 0 && (
                                        <ul className="mt-2 space-y-1 border-t border-[#f0f2f3] pt-2">
                                            {tasksInteresting.map((t) => (
                                                <li
                                                    key={t.key}
                                                    className="flex flex-wrap items-start gap-2 text-[#0b191f]"
                                                >
                                                    <span
                                                        className={cn(
                                                            'mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                                                            changeBadgeClass(t.change),
                                                        )}
                                                    >
                                                        {t.change}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        {t.title}
                                                        {t.taskId != null && (
                                                            <span className="ml-1 text-xs text-[#727d83]">
                                                                #{t.taskId}
                                                            </span>
                                                        )}
                                                        {t.locked && (
                                                            <span className="ml-2 text-xs font-medium text-amber-800">
                                                                (locked — server will skip edits)
                                                            </span>
                                                        )}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-[#0b191f] text-white hover:bg-[#1a2d36]"
                        onClick={onConfirm}
                        disabled={isApplying}
                    >
                        {isApplying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                                Applying…
                            </>
                        ) : (
                            'Apply changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
