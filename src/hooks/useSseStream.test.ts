import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { useSseStream } from "./useSseStream";

// jsdom has no EventSource — provide a controllable fake.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  closed = false;
  onerror: ((e: unknown) => void) | null = null;
  private listeners: Record<string, ((e: unknown) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, cb: (e: unknown) => void) {
    (this.listeners[type] ||= []).push(cb);
  }
  removeEventListener(type: string, cb: (e: unknown) => void) {
    this.listeners[type] = (this.listeners[type] || []).filter((c) => c !== cb);
  }
  close() {
    this.closed = true;
  }
  emitOpen() {
    (this.listeners["open"] || []).forEach((c) => c({}));
  }
  emitMessage(data: string) {
    (this.listeners["message"] || []).forEach((c) => c({ data }));
  }
  emitError() {
    this.onerror?.({});
  }
}

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });

describe("useSseStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    (globalThis as unknown as { EventSource: unknown }).EventSource = FakeEventSource;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("mints a ticket, opens the stream, and surfaces parsed events", async () => {
    const onEvent = vi.fn();
    const getUrl = vi.fn().mockResolvedValue("u1");
    const { result } = renderHook(() => useSseStream({ enabled: true, getUrl, onEvent }));

    await flush();
    expect(getUrl).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances).toHaveLength(1);

    await act(async () => { FakeEventSource.instances[0].emitOpen(); });
    expect(result.current.connected).toBe(true);

    await act(async () => { FakeEventSource.instances[0].emitMessage(JSON.stringify({ a: 1 })); });
    expect(onEvent).toHaveBeenCalledWith({ a: 1 });

    // Non-JSON keepalive comments are ignored.
    await act(async () => { FakeEventSource.instances[0].emitMessage(": keepalive"); });
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it("routes dropped-events markers to onDropped, not onEvent", async () => {
    const onEvent = vi.fn();
    const onDropped = vi.fn();
    const getUrl = vi.fn().mockResolvedValue("u1");
    renderHook(() => useSseStream({ enabled: true, getUrl, onEvent, onDropped }));
    await flush();

    await act(async () => {
      FakeEventSource.instances[0].emitMessage(JSON.stringify({ __dropped__: true }));
    });
    expect(onDropped).toHaveBeenCalledTimes(1);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("reconnects with a fresh ticket after an error (backoff)", async () => {
    let n = 0;
    const getUrl = vi.fn(() => Promise.resolve(`u${++n}`));
    const { result } = renderHook(() => useSseStream({ enabled: true, getUrl, onEvent: vi.fn() }));
    await flush();

    await act(async () => { FakeEventSource.instances[0].emitOpen(); });
    expect(result.current.connected).toBe(true);

    await act(async () => { FakeEventSource.instances[0].emitError(); });
    expect(result.current.connected).toBe(false);
    expect(FakeEventSource.instances[0].closed).toBe(true);

    // First backoff is 1s; a brand-new EventSource with a new URL is created.
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(getUrl).toHaveBeenCalledTimes(2);
    expect(FakeEventSource.instances[1].url).toBe("u2");
  });

  it("tears the stream down when disabled", async () => {
    const getUrl = vi.fn().mockResolvedValue("u1");
    const { result, rerender } = renderHook(
      ({ enabled }) => useSseStream({ enabled, getUrl, onEvent: vi.fn() }),
      { initialProps: { enabled: true } },
    );
    await flush();
    const es = FakeEventSource.instances[0];
    await act(async () => { es.emitOpen(); });
    expect(result.current.connected).toBe(true);

    rerender({ enabled: false });
    expect(es.closed).toBe(true);
    expect(result.current.connected).toBe(false);
  });
});
