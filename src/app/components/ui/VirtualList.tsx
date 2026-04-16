import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export type VirtualListProps<T> = {
  items: readonly T[];
  /** When item count is at or below this, render a plain list (no virtualizer overhead). */
  threshold?: number;
  /** Initial row height estimate (px); dynamic rows use measureElement. */
  estimateSize: number;
  /** Extra gap between rows (px), included in estimates. */
  gap?: number;
  maxHeight: string | number;
  getItemKey: (item: T, index: number) => string | number;
  children: (item: T, index: number) => ReactNode;
  className?: string;
  /** Scroll container class (overflow, max-height often set via maxHeight prop on wrapper). */
  scrollClassName?: string;
  overscan?: number;
  /** Fires when the user scrolls near the bottom (infinite pagination). */
  onEndReached?: () => void;
  /** Distance from bottom (px) to trigger onEndReached. */
  endReachedOffset?: number;
  /** Optional full-height vertical line for timeline layouts (left offset in px). */
  timelineLineLeftPx?: number;
  timelineLineClassName?: string;
  /** Uniform row height — skips per-row measurement (faster for table-like rows). */
  fixedHeight?: boolean;
};

const DEFAULT_THRESHOLD = 14;

/**
 * Windowed list rendering via `@tanstack/react-virtual` — only visible rows mount.
 * Use for long comments, activity feeds, and other tall stacks.
 */
export function VirtualList<T>({
  items,
  threshold = DEFAULT_THRESHOLD,
  estimateSize,
  gap = 0,
  maxHeight,
  getItemKey,
  children,
  className = '',
  scrollClassName = '',
  overscan = 6,
  onEndReached,
  endReachedOffset = 72,
  timelineLineLeftPx,
  timelineLineClassName = 'bg-[#e4eaec]',
  fixedHeight = false,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const endFiredRef = useRef(false);

  const rowSize = estimateSize + gap;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowSize,
    overscan,
    measureElement:
      fixedHeight || typeof window === 'undefined'
        ? undefined
        : (el: Element) => (el as HTMLElement).getBoundingClientRect().height,
  });

  useEffect(() => {
    endFiredRef.current = false;
  }, [items.length]);

  const handleScroll = useCallback(() => {
    if (!onEndReached) return;
    const el = parentRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const nearBottom = scrollHeight - scrollTop - clientHeight < endReachedOffset;
    if (nearBottom) {
      if (!endFiredRef.current) {
        endFiredRef.current = true;
        onEndReached();
      }
    } else {
      endFiredRef.current = false;
    }
  }, [onEndReached, endReachedOffset]);

  if (items.length <= threshold) {
    return (
      <div
        className={className}
        style={gap > 0 ? { display: 'flex', flexDirection: 'column', gap } : undefined}
      >
        {items.map((item, index) => children(item, index))}
      </div>
    );
  }

  const totalSize = virtualizer.getTotalSize();
  const lineHeight = timelineLineLeftPx != null ? Math.max(totalSize, 1) : undefined;

  return (
    <div
      ref={parentRef}
      className={`relative overflow-y-auto ${scrollClassName}`}
      style={{ maxHeight }}
      onScroll={onEndReached ? handleScroll : undefined}
    >
      {timelineLineLeftPx != null ? (
        <div
          className={`pointer-events-none absolute top-0 z-0 w-px ${timelineLineClassName}`}
          style={{ left: timelineLineLeftPx, height: lineHeight }}
          aria-hidden
        />
      ) : null}
      <div
        className={className}
        style={{
          height: totalSize,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const item = items[vi.index];
          if (item === undefined) return null;
          return (
            <div
              key={getItemKey(item, vi.index)}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${vi.start}px)`,
                paddingBottom: gap > 0 && vi.index < items.length - 1 ? gap : undefined,
              }}
            >
              {children(item, vi.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
