// A failed optimistic save closes the modal before the server answers, so the retry needs
// the card id (an idempotent PUT must not turn into a second card) and the card number.
// The number is excluded from the localStorage draft on purpose, so it lives in memory only.
// Picked photos are File objects that cannot be serialised, so they follow the same rule.
import type { CardPhotoChanges } from "@/app/[locale]/(user)/digital-cards/components/forms/digital-card-form-types";

const TTL_MS = 5 * 60_000;

export interface IPendingCard {
  id: string;
  codeValue: string;
  barcodeValue: string | null;
  photos?: CardPhotoChanges;
}

const stash = new Map<string, IPendingCard & { expiresAt: number }>();

export function stashPendingCard(key: string, card: IPendingCard): void {
  const now = Date.now();
  for (const [existingKey, entry] of stash) {
    if (entry.expiresAt <= now) stash.delete(existingKey);
  }
  stash.set(key, { ...card, expiresAt: now + TTL_MS });
}

export function peekPendingCard(key: string): IPendingCard | undefined {
  const entry = stash.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return undefined;
  return entry;
}

export function takePendingCard(key: string): IPendingCard | undefined {
  const entry = peekPendingCard(key);
  stash.delete(key);
  return entry;
}
