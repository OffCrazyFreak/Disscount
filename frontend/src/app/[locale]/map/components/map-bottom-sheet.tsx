"use client";

import { PointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type SheetSnap = "peek" | "half" | "full";

const ORDER: SheetSnap[] = ["peek", "half", "full"];

// Peek leaves the search field and chain chips in reach over the map.
const VISIBLE_SHARE: Record<SheetSnap, number> = {
  peek: 0.3,
  half: 0.55,
  full: 1,
};

/** How much of the map's height the sheet covers at rest. */
export function sheetCoverShare(snap: SheetSnap): number {
  return VISIBLE_SHARE[snap];
}

// A drag shorter than this is a tap on the handle, not a drag.
const DRAG_THRESHOLD_PX = 8;

interface IMapBottomSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  children: ReactNode;
}

/**
 * The phone list over a full-screen map. Not a dialog: the map stays usable,
 * so nothing is trapped or hidden from assistive tech. The handle is a real
 * button, so every height is reachable without dragging (WCAG 2.5.7).
 */
export default function MapBottomSheet({
  snap,
  onSnapChange,
  children,
}: IMapBottomSheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ startY: number; moved: boolean } | null>(null);
  // The click that follows a drag's pointerup must not also cycle the snap.
  const justDragged = useRef(false);
  const t = useTranslations("map.layout");
  const [height, setHeight] = useState(0);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const observer = new ResizeObserver(([entry]) =>
      setHeight(entry.contentRect.height),
    );
    observer.observe(sheet);

    return () => observer.disconnect();
  }, []);

  const restingOffset = height * (1 - VISIBLE_SHARE[snap]);
  const offset = dragOffset ?? restingOffset;
  const nextSnap = snap === "full" ? "peek" : ORDER[ORDER.indexOf(snap) + 1];

  function nearestSnap(currentOffset: number): SheetSnap {
    return ORDER.reduce((best, candidate) =>
      Math.abs(height * (1 - VISIBLE_SHARE[candidate]) - currentOffset) <
      Math.abs(height * (1 - VISIBLE_SHARE[best]) - currentOffset)
        ? candidate
        : best,
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY, moved: false };
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;

    const delta = event.clientY - drag.current.startY;
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) drag.current.moved = true;

    if (drag.current.moved) {
      setDragOffset(
        Math.min(
          Math.max(restingOffset + delta, 0),
          height * (1 - VISIBLE_SHARE.peek),
        ),
      );
    }
  }

  function handlePointerUp() {
    const moved = drag.current?.moved ?? false;
    drag.current = null;
    justDragged.current = moved;

    if (moved && dragOffset != null) onSnapChange(nearestSnap(dragOffset));

    setDragOffset(null);
  }

  return (
    <section
      ref={sheetRef}
      aria-label={t("storeList")}
      className={cn(
        "absolute inset-x-0 bottom-0 top-0 z-[2] flex flex-col rounded-t-2xl border-t bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.12)]",
        dragOffset == null &&
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
      )}
      style={{ transform: `translateY(${offset}px)` }}
    >
      <button
        type="button"
        aria-label={snap === "full" ? t("collapse") : t("expand")}
        onClick={() => {
          if (!justDragged.current) onSnapChange(nextSnap);
          justDragged.current = false;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex h-8 w-full shrink-0 touch-none items-center justify-center focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span
          className="h-1.5 w-12 rounded-full bg-muted-foreground/40"
          aria-hidden="true"
        />
      </button>

      <div
        className="flex min-h-0 flex-col"
        style={{ height: Math.max(height - offset - 32, 0) }}
      >
        {children}
      </div>
    </section>
  );
}
