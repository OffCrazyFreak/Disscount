// The retry needs id, number and photos, and neither the number nor File objects may enter the draft.
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
