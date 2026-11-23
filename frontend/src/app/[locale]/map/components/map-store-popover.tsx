"use client";

import { RefObject, useRef } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import MapStoreCard from "@/app/[locale]/map/components/map-store-card";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

// About two seconds, longer than the camera's ease to a picked store.
const FOCUS_WAIT_FRAMES = 120;

interface IMapStorePopoverProps {
  /** A store with a pin; the layout keeps unplaced stores in the list. */
  row: IListedStore | null;
  onClose: () => void;
  /** A map control, the same one the phone sheet hands focus to. */
  returnFocusRef: RefObject<HTMLElement | null>;
}

/** The desktop's selected store, anchored to its pin: Escape or the X deselects it. */
export default function MapStorePopover({
  row,
  onClose,
  returnFocusRef,
}: IMapStorePopoverProps) {
  const { current: map } = useMap();
  const contentRef = useRef<HTMLDivElement>(null);

  if (!row || row.store.lat == null || row.store.lon == null) return null;

  // Hidden while its pin is out of view, which a pick from the list starts with until the camera arrives.
  function focusOnceShown(framesLeft = FOCUS_WAIT_FRAMES) {
    const content = contentRef.current;
    if (!content) return;

    content.focus({ preventScroll: true });
    if (document.activeElement !== content && framesLeft > 0) {
      requestAnimationFrame(() => focusOnceShown(framesLeft - 1));
    }
  }

  // Hands focus back only while the popover holds it, so a click elsewhere keeps its own focus.
  function close() {
    if (contentRef.current?.contains(document.activeElement)) {
      returnFocusRef.current?.focus();
    }
    onClose();
  }

  return (
    <Popover open onOpenChange={(open) => !open && close()}>
      <Marker longitude={row.store.lon} latitude={row.store.lat}>
        <PopoverAnchor asChild>
          <span className="block size-0" />
        </PopoverAnchor>
      </Marker>

      <PopoverContent
        ref={contentRef}
        side="right"
        sideOffset={28}
        // The pin moves with every pan and zoom, which no resize or scroll event reports.
        updatePositionStrategy="always"
        collisionBoundary={map?.getContainer()}
        collisionPadding={12}
        hideWhenDetached
        aria-label={row.chainLabel}
        tabIndex={-1}
        // Focus the popover itself, so a screen reader starts at the store's name, not its first button.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusOnceShown();
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // The map stays in use: panning or tapping another store must not close it.
        onInteractOutside={(event) => event.preventDefault()}
        className="flex max-h-(--radix-popover-content-available-height) w-[24rem] flex-col overflow-y-auto p-1"
      >
        <MapStoreCard row={row} onClose={close} />
      </PopoverContent>
    </Popover>
  );
}
