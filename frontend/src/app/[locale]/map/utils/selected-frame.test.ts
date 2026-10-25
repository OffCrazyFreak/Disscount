import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it } from "vitest";

import { findSelectedFrame } from "@/app/[locale]/map/utils/selected-frame";

const STORE = { lat: 45.81, lon: 15.97 };

function fakeMap({
  singles = [] as string[],
  stacks = [] as { id: number; keys: string[]; chains: number }[],
}) {
  const stackFeatures = stacks.map(({ id, chains }) => ({
    geometry: { type: "Point", coordinates: [16, 45.8] },
    properties: {
      cluster_id: id,
      ...Object.fromEntries(
        Array.from({ length: chains }, (_, index) => [`count:c${index}`, 1]),
      ),
    },
  }));

  return {
    queryRenderedFeatures: ({ layers }: { layers: string[] }) =>
      layers[0] === "store-point"
        ? singles.map((key) => ({ properties: { key } }))
        : stackFeatures,
    getSource: () => ({
      getClusterLeaves: async (id: number) =>
        (stacks.find((stack) => stack.id === id)?.keys ?? []).map((key) => ({
          properties: { key },
        })),
    }),
  } as unknown as MapLibreMap;
}

describe("findSelectedFrame", () => {
  it("frames the store's own tile when it is drawn alone", async () => {
    const map = fakeMap({ singles: ["konzum:1"] });

    expect(await findSelectedFrame(map, "konzum:1", STORE)).toEqual({
      ...STORE,
      wide: false,
    });
  });

  it("moves to the stack the store merged into after zooming out", async () => {
    const map = fakeMap({
      stacks: [
        { id: 1, keys: ["lidl:2"], chains: 1 },
        { id: 2, keys: ["spar:3", "konzum:1"], chains: 2 },
      ],
    });

    expect(await findSelectedFrame(map, "konzum:1", STORE)).toEqual({
      lat: 45.8,
      lon: 16,
      wide: true,
    });
  });

  it("shows no frame while neither the store nor its stack is on screen", async () => {
    expect(await findSelectedFrame(fakeMap({}), "konzum:1", STORE)).toBeNull();
  });
});
