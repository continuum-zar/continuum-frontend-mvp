/**
 * SSE consumer hook for `GET /migrations/{job_id}/events`.
 *
 * Same shape as the inline pattern in BuildRunDrawer.tsx:
 *  1. Mint a single-use ticket via `getSseTicket()`.
 *  2. Open EventSource with `?ticket=...`.
 *  3. Parse JSON on every `message`, fan out to typed callbacks.
 *  4. Per the `guidelines/data-fetching.md` realtime contract, every event
 *     also invalidates the job's detail query — components subscribe via
 *     `useMigration(jobId)`, not via event payloads — EXCEPT the apply
 *     progress event, which fires too fast to round-trip through the
 *     query cache; consumers handle it via the callback into local state.
 *  5. Close on terminal events so clients release resources.
 *  6. Clean up on unmount; bail when disabled (e.g. job already terminal).
 *
 * The hook intentionally returns no value — the API is callback-only. That
 * keeps it usable from both the Upload page (parse phase) and the Apply
 * page (apply phase) without coupling them to a shared shape.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { migrationEventsStreamUrl, migrationKeys } from "@/api/migrations";
import type {
    MigrationApplyDoneEvent,
    MigrationApplyDryRunDoneEvent,
    MigrationApplyProgressEvent,
    MigrationApplyStartEvent,
    MigrationErrorEvent,
    MigrationEvent,
    MigrationParseFailedEvent,
    MigrationParseReadyEvent,
} from "@/types/migration";

export interface UseMigrationEventsOptions {
    /** When false, no stream is opened. Set false once the job is terminal. */
    enabled?: boolean;

    onParseReady?: (event: MigrationParseReadyEvent) => void;
    onParseFailed?: (event: MigrationParseFailedEvent) => void;
    onApplyStart?: (event: MigrationApplyStartEvent) => void;
    onApplyProgress?: (event: MigrationApplyProgressEvent) => void;
    onApplyDone?: (event: MigrationApplyDoneEvent) => void;
    onApplyDryRunDone?: (event: MigrationApplyDryRunDoneEvent) => void;
    onError?: (event: MigrationErrorEvent) => void;
}

const TERMINAL_TYPES = new Set<MigrationEvent["type"]>([
    "migration.apply.done",
    "migration.apply.dry_run_done",
    "migration.parse.failed",
    "migration.error",
]);

export function useMigrationEvents(
    jobId: number | string | undefined,
    options: UseMigrationEventsOptions = {},
): void {
    const qc = useQueryClient();
    const optsRef = useRef(options);
    optsRef.current = options;

    const enabled = options.enabled ?? true;

    useEffect(() => {
        if (!enabled || jobId === undefined) return;

        let cancelled = false;
        let es: EventSource | null = null;

        const handleMessage = (e: MessageEvent) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(e.data);
            } catch {
                return; // ignore non-JSON keepalives
            }
            if (!parsed || typeof parsed !== "object") return;
            const event = parsed as MigrationEvent;
            if (typeof event.type !== "string") return;

            const o = optsRef.current;
            switch (event.type) {
                case "migration.parse.ready":
                    o.onParseReady?.(event);
                    break;
                case "migration.parse.failed":
                    o.onParseFailed?.(event);
                    break;
                case "migration.apply.start":
                    o.onApplyStart?.(event);
                    break;
                case "migration.apply.progress":
                    // Progress is per-batch; do NOT invalidate the detail key
                    // on every tick — too chatty. Detail will refresh when
                    // `apply.done` fires below.
                    o.onApplyProgress?.(event);
                    return;
                case "migration.apply.done":
                    o.onApplyDone?.(event);
                    break;
                case "migration.apply.dry_run_done":
                    o.onApplyDryRunDone?.(event);
                    break;
                case "migration.error":
                    o.onError?.(event);
                    break;
                default:
                    return;
            }

            // Refresh the canonical detail so the page (`useMigration(jobId)`)
            // sees the new status, warnings, stats.
            qc.invalidateQueries({ queryKey: migrationKeys.detail(jobId) });

            // Terminal events close the stream so we don't leak EventSources.
            if (TERMINAL_TYPES.has(event.type)) {
                es?.close();
            }
        };

        void (async () => {
            let url: string;
            try {
                url = await migrationEventsStreamUrl(jobId);
            } catch (err) {
                console.debug("[useMigrationEvents] ticket mint failed", err);
                return;
            }
            if (cancelled) return;
            es = new EventSource(url);
            es.addEventListener("message", handleMessage as EventListener);
            es.onerror = () => {
                // Network blip or page navigation; the browser closes the
                // stream and we'll re-open on remount. Quiet by design.
                es?.close();
            };
        })();

        return () => {
            cancelled = true;
            if (es) {
                es.removeEventListener("message", handleMessage as EventListener);
                es.close();
            }
        };
    }, [enabled, jobId, qc]);
}
