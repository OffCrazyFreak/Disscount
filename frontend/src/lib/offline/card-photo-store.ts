import { createStore, delMany, get, keys, set } from "idb-keyval";

import type { CardPhotoSlot } from "@/constants/card-codes";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { updateIfPresent } from "@/lib/offline/idb-transactions";
import { whenPurgesSettled } from "@/lib/offline/purge-gate";

export type CardPhotoSize = "full" | "thumb";

interface IStoredPhoto {
  buf: ArrayBuffer;
  type: string;
  usedAt: number;
}

interface IPhotoRef {
  id: string;
  photos: { slot: string; sha256: string }[];
}

// usedAt only orders eviction, so a day of precision spares a full-blob rewrite per read.
const USED_AT_REFRESH_MS = 24 * 60 * 60 * 1000;

let store: ReturnType<typeof createStore> | undefined;

// Created lazily: idb-keyval touches indexedDB at creation, which does not exist on the server.
function photoStore() {
  store ??= createStore("disscount-card-photos", "blobs");
  return store;
}

export function photoKey(
  identity: string,
  cardId: string,
  slot: CardPhotoSlot,
  size: CardPhotoSize,
  sha256: string,
): string {
  return `${identity}:${cardId}:${slot}:${size}:${sha256}`;
}

export async function readPhoto(key: string): Promise<Blob | undefined> {
  const stored = await get<IStoredPhoto>(key, photoStore());
  if (!stored) return undefined;

  if (Date.now() - stored.usedAt > USED_AT_REFRESH_MS) {
    void updateIfPresent<IStoredPhoto>(key, photoStore(), (old) => ({
      ...old,
      usedAt: Date.now(),
    })).catch(() => undefined);
  }

  return new Blob([stored.buf], { type: stored.type });
}

export async function writePhoto(key: string, blob: Blob): Promise<void> {
  const value: IStoredPhoto = {
    buf: await blob.arrayBuffer(),
    type: blob.type,
    usedAt: Date.now(),
  };

  await whenPurgesSettled();
  // The fetch can outlive a logout; a blob written for the departed account would sit
  // there until the next prune.
  if (!key.startsWith(`${getCacheIdentity()}:`)) return;

  await set(key, value, photoStore());
}

async function deleteMatching(predicate: (key: string) => boolean) {
  const matching = (await keys(photoStore())).map(String).filter(predicate);
  await delMany(matching, photoStore());
}

export function deleteForCard(identity: string, cardId: string) {
  const prefix = `${identity}:${cardId}:`;
  return deleteMatching((key) => key.startsWith(prefix));
}

export function deleteSlotForCard(
  identity: string,
  cardId: string,
  slot: CardPhotoSlot,
) {
  const prefix = `${identity}:${cardId}:${slot}:`;
  return deleteMatching((key) => key.startsWith(prefix));
}

export function deleteForIdentity(identity: string) {
  const prefix = `${identity}:`;
  return deleteMatching((key) => key.startsWith(prefix));
}

/** Drops blobs of deleted cards and of photo versions that were replaced. */
export function pruneToCards(identity: string, cards: IPhotoRef[]) {
  const prefix = `${identity}:`;
  const shaOf = new Map(
    cards.flatMap((card) =>
      card.photos.map((p) => [`${identity}:${card.id}:${p.slot}:`, p.sha256]),
    ),
  );

  return deleteMatching((key) => {
    if (!key.startsWith(prefix)) return false;

    // key = identity:cardId:slot:size:sha256, so the slot prefix is the first four parts.
    const parts = key.split(":");
    const slotPrefix = `${parts.slice(0, 3).join(":")}:`;

    return shaOf.get(slotPrefix) !== parts[4];
  });
}
