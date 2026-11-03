import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  bulkPinnedPlaceRequestSchema,
  bulkPinnedStoreRequestSchema,
} from "@/lib/api/schemas/preferences";

// No form reads these request schemas, so they keep zod's own message instead of copy.
const defaultMessage = z.string().min(1).safeParse("").error?.issues[0].message;

describe("pinned preference request schemas", () => {
  it("rejects an empty store with zod's default message", () => {
    const result = bulkPinnedStoreRequestSchema.safeParse({
      stores: [{ storeApiId: "", storeName: "" }],
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      defaultMessage,
      defaultMessage,
    ]);
  });

  it("rejects an empty place with zod's default message", () => {
    const result = bulkPinnedPlaceRequestSchema.safeParse({
      places: [{ placeApiId: "", placeName: "" }],
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      defaultMessage,
      defaultMessage,
    ]);
  });
});
