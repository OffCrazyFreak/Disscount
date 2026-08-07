"use client";

import { useState } from "react";

/**
 * True once `ready` has been true, and true from then on.
 *
 * Gating a fetch on "the rest of the page has settled" needs a one-way switch. The flags
 * that describe settling go back to pending when the page refetches (adding a list item
 * refires the per-EAN price queries, say), and a gate that followed them would disable a
 * query that already has data. That reads as a skeleton drawn over a chart the user is
 * looking at.
 *
 * Set during render rather than in an effect: this is React's documented way to adjust
 * state when a prop changes, and it lands in the same commit instead of costing an extra
 * pass with the gate still closed.
 */
export function useSettledOnce(ready: boolean): boolean {
  const [latched, setLatched] = useState(false);

  if (ready && !latched) setLatched(true);

  return latched || ready;
}
