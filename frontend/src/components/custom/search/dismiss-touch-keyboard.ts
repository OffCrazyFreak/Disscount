/** A client-side submit never unmounts the field, so touch keyboards stay up; fine pointers keep focus so keyboard users keep their place. */
export function dismissTouchKeyboard(): void {
  if (!isTouchPointer()) return;

  const focused = document.activeElement;
  if (focused instanceof HTMLInputElement) focused.blur();
}

export function isTouchPointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
