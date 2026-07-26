import type { MouseEvent as ReactMouseEvent } from "react";

/**
 * A click with no pointer behind it, which is how Enter and Space arrive. Lets a
 * control still act on the keyboard while a captured pointer owns the pointer
 * path and retargets every real click away from it.
 */
export function isKeyboardClick(event: ReactMouseEvent<HTMLElement>): boolean {
  return event.detail === 0;
}
