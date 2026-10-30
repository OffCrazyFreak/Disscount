import { useEffect } from "react";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

const probe = vi.hoisted(() => ({ webgl2: true, mapError: null as unknown }));

vi.mock("maplibre-gl", () => ({ setWorkerUrl: vi.fn() }));
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@/app/[locale]/map/utils/map-style", () => ({
  loadMapStyle: async () => ({ version: 8, sources: {}, layers: [] }),
}));
vi.mock("@/app/[locale]/map/utils/webgl-support", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  canUseWebGL2: () => probe.webgl2,
}));
// Stands in for react-map-gl, which reports a constructor failure through
// onError instead of throwing.
vi.mock("@/app/[locale]/map/components/store-map-view", () => ({
  default: function FakeView({
    onMapError,
  }: {
    onMapError: (event: { error: unknown }) => void;
  }) {
    useEffect(() => {
      if (probe.mapError) onMapError({ error: probe.mapError });
    }, [onMapError]);

    return <div>live map</div>;
  },
}));

const { default: StoreMap } =
  await import("@/app/[locale]/map/components/store-map");

const props = {
  stores: [],
  selected: null,
  onSelect: vi.fn(),
  userLocation: null,
  centerRequest: null,
  initialView: null,
  coveredShare: 0,
  onViewChange: vi.fn(),
};

beforeEach(() => {
  probe.webgl2 = true;
  probe.mapError = null;
});

describe("StoreMap", () => {
  it("explains a browser that refuses WebGL2 instead of a blank map", async () => {
    probe.webgl2 = false;

    renderWithProviders(<StoreMap {...props} />);

    expect(
      await screen.findByText(/isključio grafičko ubrzanje/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Učitaj ponovno" }),
    ).toBeVisible();
    expect(screen.queryByText("live map")).not.toBeInTheDocument();
  });

  it("explains a WebGL2 failure the map reports after the check passed", async () => {
    const error = new Error("WebGL2 is required");
    error.name = "GPUInitializationError";
    probe.mapError = error;

    renderWithProviders(<StoreMap {...props} />);

    expect(
      await screen.findByText(/isključio grafičko ubrzanje/),
    ).toBeInTheDocument();
  });

  it("keeps the map for other map errors, and logs them", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    probe.mapError = new Error("Failed to fetch a tile");

    renderWithProviders(<StoreMap {...props} />);

    expect(await screen.findByText("live map")).toBeInTheDocument();
    expect(logged).toHaveBeenCalledWith(probe.mapError);
    logged.mockRestore();
  });
});
