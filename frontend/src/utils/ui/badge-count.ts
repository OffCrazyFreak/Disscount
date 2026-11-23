const MAX_SHOWN_BADGE_COUNT = 9;

/** A count badge stays one digit wide; the accessible name carries the exact number. */
export function formatBadgeCount(count: number): string {
  return count > MAX_SHOWN_BADGE_COUNT
    ? `${MAX_SHOWN_BADGE_COUNT}+`
    : String(count);
}
