import type { MouseEvent as ReactMouseEvent } from "react";

/**
 * A pointer-driven click carries a positive detail. Anything owning a whole
 * container's pointer stream can therefore let its children handle keyboard
 * activation only, without the two firing twice for one press.
 */
export function isKeyboardClick(event: ReactMouseEvent): boolean {
  return event.detail === 0;
}
