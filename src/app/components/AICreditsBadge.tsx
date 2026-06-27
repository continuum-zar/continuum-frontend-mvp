import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { useAICredits } from '@/api/aiCredits';

function formatResetDate(iso?: string): string {
    if (!iso) return 'the start of next month';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'the start of next month';
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Compact AI-credit indicator for the dashboard header. Shows the remaining
 * balance and, on click, the monthly allocation and reset date. Turns amber as
 * the balance runs low and red when exhausted.
 */
export function AICreditsBadge() {
    const { data, isLoading, isError } = useAICredits();

    // Stay invisible until we have real data — never flash a misleading number.
    if (isLoading || isError || !data) return null;

    const { balance, monthly_quota, reset_at, exhausted } = data;
    const lowThreshold = Math.max(1, Math.floor(monthly_quota * 0.1));
    const low = !exhausted && balance <= lowThreshold;

    const tone = exhausted
        ? 'text-destructive'
        : low
          ? 'text-warning'
          : 'text-muted-foreground';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`AI credits: ${balance} of ${monthly_quota} remaining`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent ${tone}`}
                >
                    <span>{balance.toLocaleString()}</span>
                    <span className="text-muted-foreground">credits</span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">AI Credits</h4>
                    <div className="text-2xl font-bold">
                        {balance.toLocaleString()}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                            / {monthly_quota.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={
                                exhausted
                                    ? 'h-full bg-destructive'
                                    : low
                                      ? 'h-full bg-warning'
                                      : 'h-full bg-primary'
                            }
                            style={{
                                width: `${Math.min(100, Math.max(0, (balance / Math.max(1, monthly_quota)) * 100))}%`,
                            }}
                        />
                    </div>
                    {exhausted ? (
                        <p className="text-xs text-destructive">
                            You&apos;ve used all your AI credits. They reset on{' '}
                            {formatResetDate(reset_at)}.
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Credits are spent by AI features (planner, task generation, summaries).
                            Resets to {monthly_quota.toLocaleString()} on {formatResetDate(reset_at)}.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default AICreditsBadge;
