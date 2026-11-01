/**
 * Closes the on-screen keyboard after a search commits. A client-side submit
 * never unmounts the field, so touch keyboards stay up over the results.
 * Fine pointers keep focus, so a keyboard user does not lose their place.
 */
export function dismissTouchKeyboard(): void {
  if (!isTouchPointer()) return;

  const focused = document.activeElement;
  if (focused instanceof HTMLInputElement) focused.blur();
}

export function isTouchPointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
