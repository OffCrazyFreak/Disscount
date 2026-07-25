/** Clears a deliberate tap, which runs 150-200ms, so a tap draws nothing */
export const HOLD_GATE_MS = 200;

/** iOS uses 0.5s, Android roughly 400-500ms, react-aria defaults to 500ms */
export const HOLD_FIRE_MS = 450;

/** Whatever the gate leaves, so a full ring reads as committed */
export const HOLD_RING_MS = HOLD_FIRE_MS - HOLD_GATE_MS;

/** Beyond this the press is a drag or a scroll, not a hold */
export const HOLD_CANCEL_PX = 10;

/** Keeps the bar clear of the back-swipe and the home-indicator gesture */
export const BAR_EDGE_EXCLUSION_PX = 16;

/** Far enough that a scroll, a wobble or a tap cannot expand a sheet */
export const SHEET_DRAG_EXPAND_PX = 40;
