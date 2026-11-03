import { beforeEach, describe, expect, it, vi } from "vitest";

import { photoKey, writePhoto } from "@/lib/offline/card-photo-store";
import { currentPurgeGeneration, trackPurge } from "@/lib/offline/purge-gate";

const db = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  createStore: () => "store",
  set: async (key: string, value: unknown) => void db.set(key, value),
}));

const key = photoKey("anon", "card", "front", "full", "sha");
const blob = new Blob(["photo"], { type: "image/webp" });

describe("writePhoto", () => {
  beforeEach(() => db.clear());

  it("drops a photo fetched before a purge of the same account", async () => {
    const generation = currentPurgeGeneration();
    trackPurge(Promise.resolve());

    await writePhoto(key, blob, generation);

    expect(db.size).toBe(0);
  });

  it("stores a photo when no purge started during the fetch", async () => {
    await writePhoto(key, blob, currentPurgeGeneration());

    expect([...db.keys()]).toEqual([key]);
  });
});
