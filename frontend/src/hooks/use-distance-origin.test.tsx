import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDistanceOrigin } from "@/hooks/use-distance-origin";
import type { DirectoryStoreDto } from "@/lib/api/schemas";

let user: { pinnedPlaces?: { placeApiId: string }[] } | null = null;
vi.mock("@/context/user-context", () => ({ useUser: () => ({ user }) }));

function store(
  city: string,
  lat: number,
  lon: number,
  zipcode: string | null = null,
): DirectoryStoreDto {
  return {
    chain: "konzum",
    code: `${city}-${lat}`,
    type: null,
    address: null,
    city,
    zipcode,
    phone: null,
    lat,
    lon,
    locationSource: "upstream",
  };
}

const STORES = [
  store("Zagreb", 45.8, 15.9),
  store("Zagreb", 45.82, 16.0),
  store("Split", 43.51, 16.44),
];
const GPS = { lat: 45.33, lon: 14.44 };

function mount(gps: typeof GPS | null = null) {
  return renderHook(() => useDistanceOrigin(STORES, gps));
}

describe("useDistanceOrigin", () => {
  afterEach(() => {
    const reset = mount();
    act(() => reset.result.current.pickTown(null));
    cleanup();
    user = null;
  });

  it("starts from nothing without a fix, a pick or a saved place", () => {
    expect(mount().result.current.origin).toBeNull();
  });

  it("starts from the middle of the first saved place's stores", () => {
    user = {
      pinnedPlaces: [{ placeApiId: "Zagreb" }, { placeApiId: "Split" }],
    };

    expect(mount().result.current.origin).toEqual({
      lat: expect.closeTo(45.81),
      lon: expect.closeTo(15.95),
      source: "saved",
      town: "Zagreb",
      county: null,
    });
  });

  it("lets a town picked this session beat the saved place, on every page", () => {
    user = { pinnedPlaces: [{ placeApiId: "Zagreb" }] };
    const first = mount();

    act(() => first.result.current.pickTown("Split"));

    expect(first.result.current.origin).toMatchObject({
      source: "picked",
      town: "Split",
    });
    expect(mount().result.current.town).toMatchObject({ town: "Split" });
  });

  it("lets a GPS fix beat any town", () => {
    user = { pinnedPlaces: [{ placeApiId: "Zagreb" }] };
    const { result } = mount(GPS);

    expect(result.current.origin).toEqual({
      ...GPS,
      source: "gps",
      town: null,
      county: null,
    });
    expect(result.current.town).toMatchObject({ town: "Zagreb" });
  });

  it("starts a saved namesake from the county it was saved with", () => {
    user = { pinnedPlaces: [{ placeApiId: "Sveta Nedelja|52" }] };
    const stores = [
      store("Sveta Nedelja", 45.8, 15.78, "10431"),
      store("Sveta Nedelja", 45.06, 14.06, "52466"),
    ];

    const { result } = renderHook(() => useDistanceOrigin(stores, null));

    expect(result.current.origin).toMatchObject({
      lat: 45.06,
      town: "Sveta Nedelja",
      county: "istria",
    });
  });

  it("ignores a saved place with no located store", () => {
    user = { pinnedPlaces: [{ placeApiId: "Vis" }] };

    expect(mount().result.current.origin).toBeNull();
  });
});
