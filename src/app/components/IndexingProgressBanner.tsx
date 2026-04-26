import { Loader2 } from 'lucide-react';
import type { IndexingProgressResponse } from '@/api/dashboard';
import { indexingProgressCaption, indexingProgressPercent } from '@/lib/indexingProgressDisplay';

type IndexingProgressBannerProps = {
    progress: IndexingProgressResponse | undefined;
    /** True when polling failed (network / 5xx); indexing may still complete. */
    pollFailed: boolean;
    /** When true, show a neutral success line after index completes while the query finishes. */
    showCompleteHint?: boolean;
};

export function IndexingProgressBanner({
    progress,
    pollFailed,
    showCompleteHint = true,
}: IndexingProgressBannerProps) {
    if (pollFailed) {
        return (
            <p className="text-[13px] leading-[19px] text-amber-800">
                Could not load indexing progress. The answer will still appear when ready.
            </p>
        );
    }

    if (progress?.status === 'error') {
        return (
            <p className="text-[13px] leading-[19px] text-red-600">
                {indexingProgressCaption(progress)}
            </p>
        );
    }

    const pct = progress
        ? indexingProgressPercent(progress.scanned, progress.total)
        : null;
    const caption = indexingProgressCaption(progress);
    const isWarming =
        !progress ||
        (progress.status === 'idle' && progress.scanned === 0 && progress.total === 0);
    const showBar = pct != null && progress && progress.total > 0;
    const showComplete =
        showCompleteHint &&
        progress?.status === 'complete' &&
        progress.total > 0 &&
        progress.scanned >= progress.total;

    return (
        <div className="flex w-full flex-col gap-1.5 rounded-[10px] border border-solid border-border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
                {isWarming ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                ) : null}
                <p className="min-w-0 flex-1 font-['Inter',sans-serif] text-[12px] font-medium leading-[16px] text-foreground">
                    {caption}
                </p>
            </div>
            {showBar ? (
                <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct ?? 0}
                >
                    <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            ) : null}
            {showComplete ? (
                <p className="font-['Inter',sans-serif] text-[11px] font-normal leading-[15px] text-muted-foreground">
                    Index ready — generating answer…
                </p>
            ) : null}
        </div>
    );
}
