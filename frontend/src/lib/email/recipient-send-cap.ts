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

const DOTLESS_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

// Plus tags (and Gmail's ignored dots) reach one inbox, so they share one budget.
export function inboxKey(recipient: string) {
  const address = recipient.trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at === -1) return address;

  const domain = address.slice(at + 1);
  let local = address.slice(0, at).split("+")[0];
  if (DOTLESS_DOMAINS.has(domain)) local = local.replaceAll(".", "");

  return `${local}@${domain}`;
}
