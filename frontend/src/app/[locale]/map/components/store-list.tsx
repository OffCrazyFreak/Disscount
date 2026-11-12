"use client";

import { useEffect, useRef } from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";

import ScrollFade from "@/components/custom/common/scroll-fade";
import StoreListItem from "@/app/[locale]/map/components/store-list-item";
import { useNavClearance } from "@/app/[locale]/map/hooks/use-nav-clearance";
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

// Long enough to measure the opened and closed rows, short enough not to fight scrolling.
const REVEAL_WINDOW_MS = 500;
const ROW_HEIGHT = 64;

/** Every matching store, because this list is the accessible way in; virtualized for 1000+ stores. */
export default function StoreList({
  rows,
  headings,
  orderKey,
  focusRequest,
  selectedKey,
  onSelect,
}: IStoreListProps) {
  // TanStack Virtual returns functions the compiler cannot memoize, so the opt-out keeps rows fresh.
  "use no memo";

  const t = useTranslations("map.layout");
  const scrollRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const navClearance = useNavClearance(probeRef);

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
    // On phones the list runs under the bottom nav, and this lets the last row, and any row scrolled to, clear it.
    paddingEnd: navClearance,
    scrollPaddingEnd: navClearance,
  });

  // Set while a row is clicked; a pick made elsewhere (map, Back) moves focus.
  const pickedInList = useRef(false);
  // The row just opened from the list, and until when to keep revealing it.
  const reveal = useRef<{ key: string; until: number } | null>(null);
  // Not a pick: on phones the list mounts as the search opens, and focus belongs in the field.
  const focusedKey = useRef<string | null>(selectedKey);

  // A list pick scrolls least so it does not jump; other changes go to the top; only picks move focus.
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

  // Rows measure just after the click, so the reveal reruns briefly without pulling back a scroller.
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

  // A new view puts its stores on top, so show the top, unless an open store's row is already being kept in view above.
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

    // The row mounts a frame or two after the scroll, and the list is already in place, so focusing must not scroll.
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

  // Isolated, so the fades stay under the view chip laid over the list.
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div
        ref={probeRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute h-[var(--bottom-nav-total)] w-0"
      />

      {/* Scroll padding keeps a keyboard-focused row clear of the nav too. */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pb-[var(--bottom-nav-total)]"
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

      <ScrollFade targetRef={scrollRef} side="top" />

      {/* Under the bottom nav it matches the page fade there. */}
      <ScrollFade
        targetRef={scrollRef}
        className="max-md:h-28 max-md:via-background/70"
      />
    </div>
  );
}
