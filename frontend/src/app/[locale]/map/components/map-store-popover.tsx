"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import MapStoreCard from "@/app/[locale]/map/components/map-store-card";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

// Longer than the camera's ease to a store picked from the list.
const FOCUS_WAIT_MS = 2000;

export interface IFocusRequest {
  key: string;
  /** Counts picks, so picking the same store again asks again. */
  id: number;
}

interface IMapStorePopoverProps {
  /** A store with a pin; the layout keeps the others in the list. */
  row: IListedStore | null;
  /** The store the user last picked, which takes focus once its popover shows. */
  focusRequest: IFocusRequest | null;
  onClose: () => void;
  /** A map control, the same one the phone sheet hands focus to. */
  returnFocusRef: RefObject<HTMLElement | null>;
}

// Free means nobody holds focus, or the search panel that just closed for this pick still does.
function isFocusFree() {
  const active = document.activeElement;

  return (
    !active ||
    active === document.body ||
    !active.isConnected ||
    active.closest("[data-map-search-panel]") != null
  );
}

// The popover is hidden while its pin is out of view, so it keeps trying until the camera arrives.
function focusWhenShown(content: HTMLElement) {
  const deadline = performance.now() + FOCUS_WAIT_MS;
  let frame = 0;

  function stop() {
    cancelAnimationFrame(frame);
    document.removeEventListener("pointerdown", stop, true);
    document.removeEventListener("keydown", stop, true);
  }

  function attempt() {
    content.focus({ preventScroll: true });

    const isDone =
      document.activeElement === content ||
      performance.now() > deadline ||
      !isFocusFree();
    if (isDone) stop();
    else frame = requestAnimationFrame(attempt);
  }

  // Any input means the user moved on, and focus is theirs.
  document.addEventListener("pointerdown", stop, true);
  document.addEventListener("keydown", stop, true);
  attempt();

  return stop;
}

function headerBottom() {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    "--header-bottom",
  );
  return Number.parseFloat(value) || 0;
}

/** The desktop's selected store, anchored to its pin: Escape or the X deselects it. */
export default function MapStorePopover({
  row,
  focusRequest,
  onClose,
  returnFocusRef,
}: IMapStorePopoverProps) {
  const { current: map } = useMap();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const handledRequest = useRef<number | null>(null);

  const rowKey = row?.key ?? null;

  // A deep link, or the search closing over a store already shown, keeps focus where it is.
  useEffect(() => {
    if (!content || !focusRequest || focusRequest.key !== rowKey) return;
    if (handledRequest.current === focusRequest.id) return;

    handledRequest.current = focusRequest.id;
    return focusWhenShown(content);
  }, [content, focusRequest, rowKey]);

  if (!row || row.store.lat == null || row.store.lon == null) return null;

  // Hands focus back only while the popover holds it, so a click elsewhere keeps its own focus.
  function close() {
    if (content?.contains(document.activeElement)) {
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
        ref={setContent}
        // Inside the map, so Tab moves on to the map's controls and the header stays above it.
        container={map?.getContainer()}
        side="right"
        sideOffset={28}
        // The pin moves with every pan and zoom, which no resize or scroll event reports.
        updatePositionStrategy="always"
        collisionBoundary={map?.getContainer()}
        collisionPadding={{
          top: headerBottom() + 12,
          right: 12,
          bottom: 12,
          left: 12,
        }}
        hideWhenDetached
        aria-label={row.chainLabel}
        tabIndex={-1}
        // Focus goes to the popover itself, and only for a pick (see above), so a reader starts at the store's name.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // The map stays in use: panning or tapping another store must not close it.
        onInteractOutside={(event) => event.preventDefault()}
        // The map container sets its own font, which the page's must win over.
        className="flex max-h-(--radix-popover-content-available-height) w-[24rem] flex-col overflow-y-auto p-1 font-sans text-base leading-normal"
      >
        <MapStoreCard row={row} onClose={close} />
      </PopoverContent>
    </Popover>
  );
}
