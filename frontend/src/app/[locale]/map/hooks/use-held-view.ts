"use client";

import { FocusEvent, useState } from "react";

import { IViewArea, sameView } from "@/app/[locale]/map/utils/view-area";

/** While pointer or keyboard focus is in the list, a new view waits, so rows never jump under someone reading or about to tap. */
export function useHeldView(live: IViewArea | null) {
  const [applied, setApplied] = useState(live);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const held = hovered || focused;
  const changed = !sameView(applied, live);

  // Adjusted while rendering, as React documents for derived state, so the list never paints once in the stale order.
  if (changed && !held) setApplied(live);

  return {
    applied,
    pending: changed && held,
    apply: () => {
      // The chip that calls this unmounts, and a removed element fires no blur, so the keyboard hold would otherwise never end.
      setFocused(false);
      setApplied(live);
    },
    holdProps: {
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      // Only keyboard focus holds: a tapped row keeps focus while the finger moves on to pan, and that pan should still reorder the list.
      onFocus: (event: FocusEvent<HTMLElement>) => {
        if (event.target.matches(":focus-visible")) setFocused(true);
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      },
    },
  };
}
