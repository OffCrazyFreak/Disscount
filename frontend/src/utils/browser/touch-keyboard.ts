/**
 * Closes the on-screen keyboard. A client-side submit or navigation never
 * unmounts a field that outlives it, so touch keyboards stay up over the page.
 * Fine pointers keep focus, so a keyboard user does not lose their place.
 */
export function dismissTouchKeyboard(): void {
  if (!isTouchPointer()) return;

  const focused = document.activeElement;
  if (
    focused instanceof HTMLInputElement ||
    focused instanceof HTMLTextAreaElement
  ) {
    focused.blur();
  }
}

export function isTouchPointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
