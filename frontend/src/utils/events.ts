import type { MouseEvent as ReactMouseEvent } from "react";

/** A click with no pointer behind it, so a control can act on Enter and Space while a captured pointer retargets real clicks. */
export function isKeyboardClick(event: ReactMouseEvent<HTMLElement>): boolean {
  return event.detail === 0;
}
