import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Self-contained progress toast for long-running exports (PDF generation can take
 * several seconds server-side). The bar eases toward ~92% so it always shows
 * motion without ever claiming to be finished; the real completion swaps it for a
 * success/error toast. No server progress events are available, so this is an
 * honest "working…" indicator rather than a literal byte-count.
 */
function ExportProgressToast({ title }: { title: string }) {
  const [pct, setPct] = useState(8);
  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => (p >= 92 ? 92 : Math.min(92, p + Math.max(0.7, (92 - p) * 0.06))));
    }, 220);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-[340px] flex-col gap-2.5 rounded-[10px] border border-[#ebedee] bg-white p-3.5 shadow-[0px_12px_32px_0px_rgba(15,15,31,0.12)]">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 shrink-0 animate-spin text-[#24B5F8]" aria-hidden />
        <span className="font-['Satoshi:Medium',sans-serif] text-[13px] font-medium text-[#0b191f]">
          {title}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[#e4e8eb]"
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className="h-full rounded-full bg-[#24B5F8] transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Show a progress toast while awaiting an export, then replace it with a
 * success or error toast. Keeps the toast up until the work actually settles.
 */
export async function runWithExportProgress(opts: {
  title: string;
  success: string;
  errorFallback: string;
  task: () => Promise<unknown>;
  getErrorMessage?: (err: unknown, fallback: string) => string;
}): Promise<void> {
  const id = toast.custom(() => <ExportProgressToast title={opts.title} />, {
    duration: Infinity,
  });
  try {
    await opts.task();
    toast.success(opts.success, { id, duration: 4000 });
  } catch (err) {
    const msg = opts.getErrorMessage
      ? opts.getErrorMessage(err, opts.errorFallback)
      : opts.errorFallback;
    toast.error(msg, { id, duration: 6000 });
  }
}
