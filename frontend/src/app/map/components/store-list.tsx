"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import StoreListItem from "@/app/map/components/store-list-item";
import { IListedStore } from "@/app/map/hooks/use-visible-stores";

interface IStoreListProps {
  rows: IListedStore[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** The store just closed, focused again when the list comes back. */
  returnFocusKey?: string | null;
}

const ROW_HEIGHT = 64;

/**
 * Every matching store, map or no map: this list is the accessible way in, so
 * keyboard and screen reader users never need the canvas. Virtualized, since
 * an unfiltered list is well over a thousand stores.
 */
export default function StoreList({
  rows,
  selectedKey,
  onSelect,
  returnFocusKey = null,
}: IStoreListProps) {
  // TanStack Virtual hands back functions the compiler cannot memoize safely;
  // opting out explicitly keeps the virtualized rows from going stale.
  "use no memo";

  const scrollRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- opted out above
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Mount only: the list remounts each time a store's details close.
  useEffect(() => {
    const index = rows.findIndex((row) => row.key === returnFocusKey);
    if (index < 0) return;

    virtualizer.scrollToIndex(index, { align: "center" });

    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector<HTMLElement>(
          `[data-store-key="${CSS.escape(rows[index].key)}"]`,
        )
        ?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <ul
        aria-label="Trgovine"
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index];

          return (
            <li
              key={row.key}
              aria-setsize={rows.length}
              aria-posinset={item.index + 1}
              className="absolute inset-x-0"
              style={{
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
            >
              <StoreListItem
                row={row}
                isSelected={row.key === selectedKey}
                onSelect={onSelect}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
