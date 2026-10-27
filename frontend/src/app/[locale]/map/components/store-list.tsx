"use client";

import { useEffect, useRef } from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";

import StoreListItem from "@/app/[locale]/map/components/store-list-item";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { toListEntries } from "@/app/[locale]/map/utils/list-entries";
import { revealOffset } from "@/app/[locale]/map/utils/reveal-offset";

interface IStoreListProps {
  rows: IListedStore[];
  /** Group labels, keyed by the index of the row each group starts at. */
  headings?: Map<number, string>;
  /** Changes when the map view changes which stores lead the list. */
  orderKey: string;
  /** Changes when the list should take focus: the open store, else the top. */
  focusRequest: number;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

// A closed row; open rows are measured.

// Long enough for the virtualizer to measure an opened row and the one that
// closed above it, short enough not to fight the user's own scrolling.
const REVEAL_WINDOW_MS = 500;
const ROW_HEIGHT = 64;

/**
 * Every matching store, map or no map: this list is the accessible way in, so
 * keyboard and screen reader users never need the canvas. Virtualized, since
 * an unfiltered list is well over a thousand stores.
 */
export default function StoreList({
  rows,
  headings,
  orderKey,
  focusRequest,
  selectedKey,
  onSelect,
}: IStoreListProps) {
  // TanStack Virtual hands back functions the compiler cannot memoize safely;
  // opting out explicitly keeps the virtualized rows from going stale.
  "use no memo";

  const t = useTranslations("map.layout");
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = toListEntries(rows, headings);
  const selectedIndex = entries.findIndex(
    (entry) => entry.kind === "store" && entry.key === selectedKey,
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- opted out above
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    // Measured heights follow the store, not the position, when filters change.
    getItemKey: (index) => entries[index].key,
    // The open row stays mounted, so focus on its actions survives scrolling.
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      return selectedIndex < 0 || indexes.includes(selectedIndex)
        ? indexes
        : [...indexes, selectedIndex].sort((a, b) => a - b);
    },
    overscan: 8,
  });

  // Set while a row is clicked; a pick made elsewhere (map, Back) moves focus.
  const pickedInList = useRef(false);
  // The row just opened from the list, and until when to keep revealing it.
  const reveal = useRef<{ key: string; until: number } | null>(null);
  // The store open when the list mounts is no pick: on phones the list mounts
  // as the search opens, and focus belongs in the field then.
  const focusedKey = useRef<string | null>(selectedKey);

  // A row opened in the list is revealed with the least scrolling (below), so
  // one already in view does not jump. Any other change, such as a pick from
  // the map or a filter that moves the open store, brings it to the top.
  // Focus moves only for a new pick, never while someone filters.
  useEffect(() => {
    const fromList = pickedInList.current;
    pickedInList.current = false;

    if (selectedIndex < 0) {
      focusedKey.current = null;
      return;
    }

    reveal.current =
      fromList && selectedKey
        ? { key: selectedKey, until: performance.now() + REVEAL_WINDOW_MS }
        : null;
    if (!fromList) {
      virtualizer.scrollToIndex(selectedIndex, { align: "start" });
    }

    const isNewPick = focusedKey.current !== selectedKey;
    focusedKey.current = selectedKey;
    if (fromList || !isNewPick) return;

    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector<HTMLElement>(
          `[data-store-key="${CSS.escape(entries[selectedIndex].key)}"]`,
        )
        ?.focus({ preventScroll: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, selectedIndex]);

  // Opening a row collapses the one above it, and the virtualizer measures
  // both a moment after the click, so the reveal reruns while they settle.
  // Only briefly: later shifts must not pull back someone who scrolled away.
  const openRow = virtualizer
    .getVirtualItems()
    .find((item) => item.index === selectedIndex);
  const viewHeight = virtualizer.scrollRect?.height ?? 0;

  useEffect(() => {
    const pending = reveal.current;
    if (!openRow || !viewHeight || pending?.key !== selectedKey) return;
    if (performance.now() > pending.until) return;

    const top = virtualizer.scrollOffset ?? 0;
    const offset = revealOffset(openRow, {
      start: top,
      end: top + viewHeight,
    });

    if (offset != null) virtualizer.scrollToOffset(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRow?.start, openRow?.end, viewHeight]);

  // A new view puts its stores on top, so show the top, unless a store is open
  // and the effects above already keep that row in view.
  useEffect(() => {
    if (selectedIndex < 0) virtualizer.scrollToOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);

  useEffect(() => {
    if (focusRequest === 0) return;

    const target =
      selectedIndex >= 0
        ? entries[selectedIndex]
        : entries.find((entry) => entry.kind === "store");
    if (!target) return;

    const selector = `[data-store-key="${CSS.escape(target.key)}"]`;

    if (selectedIndex < 0) virtualizer.scrollToIndex(0);

    // The row mounts once the virtualizer reacts to the scroll, which can take
    // a frame or two; the list is already in place, so focusing must not scroll.
    let frames = 0;
    function focusTarget() {
      const row = scrollRef.current?.querySelector<HTMLElement>(selector);

      if (row) row.focus({ preventScroll: true });
      else if (++frames < 4) requestAnimationFrame(focusTarget);
    }

    requestAnimationFrame(focusTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  function selectInList(key: string | null) {
    pickedInList.current = true;
    onSelect(key);
  }

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <ul
        aria-label={t("stores")}
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const entry = entries[item.index];

          return (
            <li
              key={entry.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              aria-setsize={entries.length}
              aria-posinset={item.index + 1}
              className="absolute inset-x-0"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              {entry.kind === "heading" ? (
                <h2 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {entry.label}
                </h2>
              ) : (
                <StoreListItem
                  row={entry.row}
                  isSelected={entry.key === selectedKey}
                  onSelect={selectInList}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
