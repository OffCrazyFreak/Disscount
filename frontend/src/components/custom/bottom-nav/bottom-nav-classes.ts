/** A ceiling rather than a fixed width, because five 3.6rem cells overflow a 280px viewport and any raised root font size. */
export const CELL_ITEM_CLASS =
  "relative w-full max-w-[3.6rem] min-w-0 flex-1 [--press-progress:0]";

/** iOS raises a selection callout and a drag ghost on a long press, straight through the gesture, so every holdable surface suppresses them. */
export const CELL_BUTTON_CLASS =
  "relative flex size-full cursor-pointer flex-col items-center justify-center gap-[0.2rem] select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]";

export const CELL_LABEL_CLASS =
  "relative h-[0.85rem] overflow-hidden text-[0.65rem] leading-none tracking-tight";

/** 3.6rem pads the widest Croatian label once bold (Proizvodi, about 44.7px), and the disc and rings share it so they stay concentric. */
export const CELL_DISC_CLASS =
  "absolute top-1/2 left-1/2 size-[3.6rem] -translate-x-1/2 -translate-y-1/2";
