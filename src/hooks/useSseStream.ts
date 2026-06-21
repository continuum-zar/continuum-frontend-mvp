import { useEffect, useRef, useState } from "react";

/**
 * Shared EventSource lifecycle for every SSE consumer in the app.
 *
 * Why a hook instead of the inline pattern each consumer used:
 *  - **Fresh ticket per connect.** Our SSE auth tickets are single-use, so the
 *    native EventSource auto-reconnect (which replays the same URL) always
 *    failed on its second attempt. `getUrl` is called once per connect attempt —
 *    including reconnects — so each connection mints its own ticket.
 *  - **Reconnect with backoff.** The old code called `es.close()` in `onerror`
 *    and only re-opened on remount, so a network blip killed realtime until the
 *    component happened to re-mount. Here we reconnect with exponential backoff
 *    (1s, 2s, 4s, … capped) and reset the backoff once a connection opens.
 *  - **Backpressure.** When the backend drops buffered events for a slow
 *    consumer it emits a dropped marker; we surface it via `onDropped` so the
 *    consumer can refetch authoritative state instead of silently missing data.
 *  - **`connected` flag.** Lets a consumer disable redundant polling while the
 *    stream is healthy (and resume it during an outage).
 */
export interface UseSseStreamOptions {
  /** When false the stream is not opened, and any open one is torn down. */
  enabled: boolean;
  /**
   * Mint a fresh single-use ticket and return the EventSource URL. Invoked once
   * per connect attempt (initial + every reconnect).
   */
  getUrl: () => Promise<string>;
  /** Parsed JSON for each `message` that isn't a keepalive or dropped marker. */
  onEvent: (data: unknown) => void;
  /**
   * Backend signalled it dropped buffered events (slow-consumer backpressure).
   * Consumers should refetch authoritative state. When omitted, the dropped
   * marker is forwarded to `onEvent` instead (back-compat).
   */
  onDropped?: () => void;
  /** Changing this tears the stream down and reconnects (e.g. the target id). */
  resetKey?: string | number;
  /** Backoff ceiling between reconnect attempts (ms). Default 30s. */
  maxBackoffMs?: number;
}

/** Recognise the dropped-events marker across the backend's SSE wire shapes. */
function isDroppedMarker(o: Record<string, unknown>): boolean {
  if (o.__dropped__ === true) return true;
  // deployment route: {"type":"warning","reason":"events_dropped"}
  if (o.type === "warning" && (o as { reason?: string }).reason === "events_dropped") return true;
  // agent-run route: {"kind":"warning","payload":{"reason":"events_dropped"}}
  if (o.kind === "warning") {
    const payload = (o as { payload?: { reason?: string } }).payload;
    if (payload && payload.reason === "events_dropped") return true;
  }
  return false;
}

export function useSseStream(opts: UseSseStreamOptions): { connected: boolean } {
  const { enabled, resetKey, maxBackoffMs = 30_000 } = opts;
  const [connected, setConnected] = useState(false);

  // Keep callbacks in refs so changing their identity (callers pass inline
  // closures) doesn't tear down and reopen the stream.
  const getUrlRef = useRef(opts.getUrl);
  const onEventRef = useRef(opts.onEvent);
  const onDroppedRef = useRef(opts.onDropped);
  getUrlRef.current = opts.getUrl;
  onEventRef.current = opts.onEvent;
  onDroppedRef.current = opts.onDropped;

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let closed = false;
    let es: EventSource | null = null;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const setConnectedSafe = (v: boolean) => {
      if (!closed) setConnected(v);
    };

    const scheduleReconnect = () => {
      if (closed || timer) return;
      const delay = Math.min(maxBackoffMs, 1000 * 2 ** attempt);
      attempt += 1;
      timer = setTimeout(() => {
        timer = null;
        void connect();
      }, delay);
    };

    const handleMessage = (e: MessageEvent) => {
      let data: unknown;
      try {
        data = JSON.parse(e.data);
      } catch {
        return; // keepalive comment / non-JSON
      }
      if (
        data &&
        typeof data === "object" &&
        isDroppedMarker(data as Record<string, unknown>) &&
        onDroppedRef.current
      ) {
        onDroppedRef.current();
        return;
      }
      onEventRef.current(data);
    };

    const connect = async () => {
      if (closed) return;
      let url: string;
      try {
        url = await getUrlRef.current();
      } catch (err) {
        console.debug("[useSseStream] ticket mint failed; will retry", err);
        scheduleReconnect();
        return;
      }
      if (closed) return;
      const source = new EventSource(url);
      es = source;
      source.addEventListener("open", () => {
        attempt = 0; // healthy connection → reset backoff
        setConnectedSafe(true);
      });
      source.addEventListener("message", handleMessage as EventListener);
      source.onerror = () => {
        setConnectedSafe(false);
        source.close();
        if (es === source) es = null;
        scheduleReconnect();
      };
    };

    void connect();

    return () => {
      closed = true;
      if (timer) clearTimeout(timer);
      setConnected(false);
      if (es) {
        es.removeEventListener("message", handleMessage as EventListener);
        es.close();
      }
    };
    // Callbacks are read through refs; only these structural inputs reconnect.
  }, [enabled, resetKey, maxBackoffMs]);

  return { connected };
}
