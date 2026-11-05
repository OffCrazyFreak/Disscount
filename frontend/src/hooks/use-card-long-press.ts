"use client";

import useLongPress from "@/hooks/use-long-press";

function stopEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/** Shields controls because stopping click alone still ran the button after the sheet opened. */
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
    /** A press that opened the sheet must not follow the link; keyboard activation never starts a hold. */
    cancelNavigationAfterPress: (viaKeyboard: boolean) => {
      if (!viaKeyboard && hasFired()) return false;
    },
  };
}
