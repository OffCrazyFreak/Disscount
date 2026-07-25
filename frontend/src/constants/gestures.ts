/** Clears a deliberate tap, which runs 150-200ms, so a tap never flashes the ring */
export const HOLD_GATE_MS = 200;

/** iOS uses 0.5s and Android roughly 400-500ms, so this sits just inside both */
export const HOLD_FIRE_MS = 450;

/** Whatever the gate leaves, so a full ring reads as committed */
export const HOLD_RING_MS = HOLD_FIRE_MS - HOLD_GATE_MS;

/** Past this, a press is a drag or a scroll, so the gesture is abandoned */
export const HOLD_CANCEL_PX = 10;

/** An abandoned ring retracts over this, rather than vanishing between frames */
export const HOLD_DRAIN_MS = 120;

/** Keeps a press clear of the iOS edge-swipe and home-indicator zones */
export const BAR_EDGE_EXCLUSION_PX = 16;

/** How far past the pill a thumb may stray and still count as on the bar */
export const BAR_VERTICAL_SLOP_PX = 24;

/** Far enough that a scroll, a wobble or a tap cannot expand a sheet */
export const SHEET_DRAG_EXPAND_PX = 40;
