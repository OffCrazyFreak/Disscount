import type { MouseEvent as ReactMouseEvent } from "react";

/** A click with no pointer behind it, so a control acts on Enter and Space while a pointer capture retargets clicks. */
export function isKeyboardClick(event: ReactMouseEvent<HTMLElement>): boolean {
  return event.detail === 0;
}
