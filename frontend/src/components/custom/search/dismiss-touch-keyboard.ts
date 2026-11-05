/** A client-side submit keeps the field mounted, so touch keyboards stay up; fine pointers keep focus. */
export function dismissTouchKeyboard(): void {
  if (!isTouchPointer()) return;

  const focused = document.activeElement;
  if (focused instanceof HTMLInputElement) focused.blur();
}

export function isTouchPointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
