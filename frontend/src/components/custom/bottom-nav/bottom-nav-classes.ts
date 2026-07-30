/** Each cell owns its own list item, so the row's geometry is stated once here */
export const CELL_ITEM_CLASS =
  "relative w-[3.6rem] shrink-0 [--press-progress:0]";

/**
 * iOS raises a selection callout and a drag ghost on a long press, and both fire
 * straight through the gesture, so every holdable surface suppresses them.
 */
export const CELL_BUTTON_CLASS =
  "relative flex size-full cursor-pointer flex-col items-center justify-center gap-[0.2rem] select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]";

export const CELL_LABEL_CLASS =
  "relative h-[0.85rem] overflow-hidden text-[0.65rem] leading-none tracking-tight";

/**
 * 3.6rem is 57.6px: enough to pad the widest label once bold (Potrošnja, about
 * 48px) while still fitting a 59.8px cell at a 320px viewport. The disc and both
 * rings share it, which is what keeps them concentric.
 */
export const CELL_DISC_CLASS =
  "absolute top-1/2 left-1/2 size-[3.6rem] -translate-x-1/2 -translate-y-1/2";
