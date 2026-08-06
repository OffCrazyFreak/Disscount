"use client";

import useLongPress from "@/hooks/use-long-press";

function stopEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/**
 * Everything a pressable card needs from one hold gesture: the handlers for the
 * card root, a shield for its action controls, and a navigation guard.
 *
 * The shield matters because the card owns the gesture. Stopping click alone
 * still let a hold on a button open the sheet and then run the button on release.
 */
export default function useCardLongPress(onLongPress: () => void) {
  const { hasFired, ...pressProps } = useLongPress({ onLongPress });

  return {
    /** Spread on the card root; the ring's CSS variable lands on this element. */
    pressProps,
    /** Spread on each cluster of action controls inside the card. */
    actionProps: {
      onClick: stopEvent,
      onPointerDown: stopEvent,
      onPointerUp: stopEvent,
    },
    /**
     * Pass to a StretchedLink's onNavigate: a press that already opened the sheet
     * must not also follow the link when the finger lifts. Keyboard activation
     * never starts a hold, so it is always allowed through.
     */
    cancelNavigationAfterPress: (viaKeyboard: boolean) => {
      if (!viaKeyboard && hasFired()) return false;
    },
  };
}
