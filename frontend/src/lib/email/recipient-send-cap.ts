// Caps mail per address, so auth flows cannot flood a stranger's inbox or burn the quota.
export const RECIPIENT_SENDS_PER_HOUR = 3;
export const RECIPIENT_SENDS_PER_DAY = 10;

export interface IRecipientSendCounts {
  lastHour: number;
  lastDay: number;
}

export interface IRecipientSendGate {
  tryReserve(recipient: string): Promise<boolean>;
  release(recipient: string): Promise<void>;
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

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

// Plus tags (and Gmail's ignored dots) reach one inbox, so they share one budget.
export function inboxKey(recipient: string) {
  const address = recipient.trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at === -1) return address;

  let domain = address.slice(at + 1);
  let local = address.slice(0, at).split("+")[0] || address.slice(0, at);
  if (GMAIL_DOMAINS.has(domain)) {
    domain = "gmail.com";
    local = local.replaceAll(".", "");
  }

  return `${local}@${domain}`;
}
