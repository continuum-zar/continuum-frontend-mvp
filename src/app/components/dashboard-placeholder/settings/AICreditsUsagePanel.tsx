import { useAICredits } from "@/api/aiCredits";

function formatResetDate(iso?: string): string {
  if (!iso) return "the start of next month";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "the start of next month";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Settings → Usage panel: shows the user's AI credit balance, monthly
 * allocation, reset date, and a short explanation of how credits work.
 */
export function AICreditsUsagePanel() {
  const { data, isLoading, isError, refetch } = useAICredits();

  if (isLoading) {
    return (
      <p className="font-['Satoshi',sans-serif] text-[14px] text-[#606d76]">
        Loading your AI usage…
      </p>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="font-['Satoshi',sans-serif] text-[14px] text-[#606d76]">
          We couldn&apos;t load your AI usage right now.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#5521fe] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const { balance, monthly_quota, reset_at, last_reset_at, exhausted } = data;
  const used = Math.max(0, monthly_quota - balance);
  const pctRemaining = Math.min(
    100,
    Math.max(0, (balance / Math.max(1, monthly_quota)) * 100),
  );
  const lowThreshold = Math.max(1, Math.floor(monthly_quota * 0.1));
  const low = !exhausted && balance <= lowThreshold;
  const barColor = exhausted
    ? "bg-red-500"
    : low
      ? "bg-amber-500"
      : "bg-gradient-to-r from-[#24b5f8] to-[#5521fe]";

  return (
    <div className="flex flex-col gap-6">
      {/* Balance card */}
      <div className="flex flex-col gap-4 rounded-[8px] border border-[#ebedee] p-5">
        <span className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
          AI Credits
        </span>

        <div className="flex items-end gap-2">
          <span
            className={`font-['Satoshi',sans-serif] text-[32px] font-bold leading-none ${
              exhausted ? "text-red-600" : "text-[#0b191f]"
            }`}
          >
            {balance.toLocaleString()}
          </span>
          <span className="font-['Satoshi',sans-serif] text-[14px] text-[#606d76]">
            of {monthly_quota.toLocaleString()} remaining
          </span>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f3]"
          role="progressbar"
          aria-valuenow={balance}
          aria-valuemin={0}
          aria-valuemax={monthly_quota}
        >
          <div className={`h-full ${barColor}`} style={{ width: `${pctRemaining}%` }} />
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
          <Stat label="Used this month" value={used.toLocaleString()} />
          <Stat label="Monthly allocation" value={monthly_quota.toLocaleString()} />
          <Stat label="Resets on" value={formatResetDate(reset_at)} />
          {last_reset_at ? (
            <Stat label="Last reset" value={formatResetDate(last_reset_at)} />
          ) : null}
        </div>

        {exhausted ? (
          <p className="font-['Satoshi',sans-serif] text-[13px] text-red-600">
            You&apos;ve used all of your AI credits. AI features are paused until your
            balance resets on {formatResetDate(reset_at)}, or an admin tops you up.
          </p>
        ) : low ? (
          <p className="font-['Satoshi',sans-serif] text-[13px] text-amber-600">
            You&apos;re running low on AI credits. They reset on {formatResetDate(reset_at)}.
          </p>
        ) : null}
      </div>

      {/* How it works */}
      <div className="flex flex-col gap-2">
        <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
          How AI credits work
        </span>
        <ul className="ml-4 list-disc font-['Satoshi',sans-serif] text-[13px] leading-relaxed text-[#606d76]">
          <li>
            Every AI feature, including the project planner, task &amp; wiki generation,
            summaries, and commit classification, spends credits based on its actual cost.
          </li>
          <li>You get {monthly_quota.toLocaleString()} credits at the start of each month.</li>
          <li>
            When your balance reaches zero, AI actions are paused until the next monthly
            reset. Everything else keeps working as normal.
          </li>
          <li>Need more before then? Ask an administrator to top up your balance.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-['Satoshi',sans-serif] text-[12px] text-[#9aa4ab]">{label}</span>
      <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
        {value}
      </span>
    </div>
  );
}

export default AICreditsUsagePanel;
