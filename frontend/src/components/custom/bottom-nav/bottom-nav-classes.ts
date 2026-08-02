/**
 * Each cell owns its own list item, so the row's geometry is stated once here.
 *
 * A ceiling rather than a fixed width: five non-shrinkable 3.6rem cells plus the
 * pill's padding and margin came to 19.8rem, which is 316.8px at a 16px root and
 * overflows both a 280px viewport and any root font size the user raises, since
 * rem scales with it. Compressing below the ceiling keeps the row inside the pill.
 */
export const CELL_ITEM_CLASS =
  "relative w-full max-w-[3.6rem] min-w-0 flex-1 [--press-progress:0]";

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
 * 48px). The disc and both rings share it, which is what keeps them concentric.
 */
export const CELL_DISC_CLASS =
  "absolute top-1/2 left-1/2 size-[3.6rem] -translate-x-1/2 -translate-y-1/2";
