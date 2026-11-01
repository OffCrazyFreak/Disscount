// Caps mail to one address however many IPs or accounts ask for it, so the
// auth flows cannot be used to flood a stranger's inbox or burn the provider quota.
export const RECIPIENT_SENDS_PER_HOUR = 3;
export const RECIPIENT_SENDS_PER_DAY = 10;

export interface IRecipientSendCounts {
  lastHour: number;
  lastDay: number;
}

export interface IRecipientSendGate {
  // Records the send and returns true, or returns false without recording.
  tryReserve(recipient: string): Promise<boolean>;
}

export class RecipientCapReachedError extends Error {
  override name = "RecipientCapReachedError";
}

export function hasRecipientBudget({
  lastHour,
  lastDay,
}: IRecipientSendCounts) {
  return (
    lastHour < RECIPIENT_SENDS_PER_HOUR && lastDay < RECIPIENT_SENDS_PER_DAY
  );
}
