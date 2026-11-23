"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { Popup } from "react-map-gl/maplibre";

import MapStoreCard from "@/app/[locale]/map/components/map-store-card";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

// Long enough for the popup to join the map after the camera starts moving.
const FOCUS_WAIT_MS = 2000;

export interface IFocusRequest {
  key: string;
  /** Counts picks, so picking the same store again asks again. */
  id: number;
}

interface IMapStorePopoverProps {
  /** A store with a pin; the layout keeps the others in the list. */
  row: IListedStore | null;
  /** The store the user last picked, which takes focus once its card shows. */
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

function isShown(card: HTMLElement) {
  return card.isConnected && getComputedStyle(card).visibility !== "hidden";
}

/** Tries each frame until the card is on the page and focused; stop() cancels, onDone() reports a settled request. */
function focusWhenShown(card: HTMLElement, onDone: () => void) {
  const deadline = performance.now() + FOCUS_WAIT_MS;
  let frame = 0;

  function detach() {
    cancelAnimationFrame(frame);
    document.removeEventListener("pointerdown", settle, true);
    document.removeEventListener("keydown", settle, true);
  }

  function settle() {
    detach();
    onDone();
  }

  function attempt() {
    if (isShown(card)) card.focus({ preventScroll: true });

    const isDone =
      document.activeElement === card ||
      performance.now() > deadline ||
      (isShown(card) && !isFocusFree());
    if (isDone) settle();
    else frame = requestAnimationFrame(attempt);
  }

  // Any input means the user moved on, and focus is theirs.
  document.addEventListener("pointerdown", settle, true);
  document.addEventListener("keydown", settle, true);
  attempt();

  return detach;
}

/** The desktop's selected store in MapLibre's own popup at its pin; it traps nothing, so Tab moves on in page order. */
export default function MapStorePopover({
  row,
  focusRequest,
  onClose,
  returnFocusRef,
}: IMapStorePopoverProps) {
  const [card, setCard] = useState<HTMLDivElement | null>(null);
  const handledRequest = useRef<number | null>(null);

  const rowKey = row?.key ?? null;

  // A deep link, or the search closing over a store already shown, keeps focus where it is.
  useEffect(() => {
    if (!card || !focusRequest || focusRequest.key !== rowKey) return;
    if (handledRequest.current === focusRequest.id) return;

    // Marked only once settled, so StrictMode's second run starts over instead of finding it done.
    return focusWhenShown(card, () => {
      handledRequest.current = focusRequest.id;
    });
  }, [card, focusRequest, rowKey]);

  if (!row || row.store.lat == null || row.store.lon == null) return null;

  // Hands focus back only while the card holds it, so a click elsewhere keeps its own focus.
  function close() {
    if (card?.contains(document.activeElement)) {
      returnFocusRef.current?.focus();
    }
    onClose();
  }

  return (
    <Popup
      longitude={row.store.lon}
      latitude={row.store.lat}
      offset={28}
      maxWidth="none"
      closeButton={false}
      // The map stays in use: panning or tapping elsewhere must not close it.
      closeOnClick={false}
      closeOnMove={false}
      focusAfterOpen={false}
      className="[&_.maplibregl-popup-content]:rounded-md [&_.maplibregl-popup-content]:border [&_.maplibregl-popup-content]:p-1 [&_.maplibregl-popup-content]:shadow-md"
    >
      <div
        ref={setCard}
        role="dialog"
        aria-label={row.chainLabel}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;

          event.stopPropagation();
          close();
        }}
        // The map container sets its own font, which the page's must win over.
        className="flex max-h-[min(30rem,calc(100svh-var(--header-bottom)-3rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-y-auto font-sans text-base leading-normal text-popover-foreground outline-hidden"
      >
        <MapStoreCard row={row} onClose={close} />
      </div>
    </Popup>
  );
}
