"use client";

import useLongPress from "@/hooks/use-long-press";

function stopEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/** Shields action controls because stopping click alone still let a hold on a button open the sheet and run the button on release. */
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
    /** A press that already opened the sheet must not follow the link on lift; keyboard activation never starts a hold, so it passes. */
    cancelNavigationAfterPress: (viaKeyboard: boolean) => {
      if (!viaKeyboard && hasFired()) return false;
    },
  };
}
