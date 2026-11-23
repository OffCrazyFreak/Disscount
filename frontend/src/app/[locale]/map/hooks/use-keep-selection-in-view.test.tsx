import { renderHook, waitFor } from "@testing-library/react";
import type { MapRef } from "react-map-gl/maplibre";
import { describe, expect, it, vi } from "vitest";

import { useKeepSelectionInView } from "@/app/[locale]/map/hooks/use-keep-selection-in-view";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { IMapCover } from "@/app/[locale]/map/utils/view-area";

const PHONE_COVER: IMapCover = { top: 77, bottom: 525, right: 0 };

function fakeMap({ width = 375, height = 812, pinY = 406 } = {}) {
  const container = document.createElement("div");
  Object.defineProperty(container, "clientWidth", { value: width });
  Object.defineProperty(container, "clientHeight", { value: height });

  const listeners = new Set<(event: { originalEvent?: Event }) => void>();
  const state = { moving: false };

  const map = {
    getContainer: () => container,
    isMoving: () => state.moving,
    project: () => ({ x: width / 2, y: pinY }),
    panBy: vi.fn(),
    on: (_type: string, listener: (event: { originalEvent?: Event }) => void) =>
      listeners.add(listener),
    off: (
      _type: string,
      listener: (event: { originalEvent?: Event }) => void,
    ) => listeners.delete(listener),
  };

  const mapRef = { current: { getMap: () => map } as unknown as MapRef };

  function userMoves() {
    listeners.forEach((listener) =>
      listener({ originalEvent: new Event("mousedown") }),
    );
  }

  return { map, mapRef, container, state, userMoves };
}

function addCard(container: HTMLElement, top: number, bottom: number) {
  const popup = document.createElement("div");
  popup.className = "maplibregl-popup";
  popup.getBoundingClientRect = () =>
    ({ left: 400, top, right: 784, bottom }) as DOMRect;
  container.appendChild(popup);
}

function renderKeepInView(
  mapRef: { current: MapRef },
  cover: IMapCover,
  key = "konzum:0004",
) {
  return renderHook(() =>
    useKeepSelectionInView({
      mapRef,
      mapReady: true,
      selected: {
        key,
        store: { lat: 45.8, lon: 15.9 },
      } as IListedStore,
      cover,
    }),
  );
}

describe("useKeepSelectionInView", () => {
  it("lifts the picked pin out from under the phone's store sheet", async () => {
    const { map, mapRef } = fakeMap();

    renderKeepInView(mapRef, PHONE_COVER);

    // The pin's bottom (430) must rise above the sheet's top (812 - 525 - 12 = 275).
    await waitFor(() => expect(map.panBy).toHaveBeenCalledWith([0, 155]));
  });

  it("moves the desktop card fully into view below the header", async () => {
    const { map, mapRef, container } = fakeMap({
      width: 1440,
      height: 900,
      pinY: 450,
    });
    addCard(container, 478, 980);

    renderKeepInView(mapRef, { top: 79, bottom: 0, right: 0 });

    await waitFor(() => expect(map.panBy).toHaveBeenCalledWith([0, 92]));
  });

  it("waits for the camera to stop before fitting", async () => {
    const { map, mapRef, state } = fakeMap();
    state.moving = true;

    renderKeepInView(mapRef, PHONE_COVER);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(map.panBy).not.toHaveBeenCalled();

    state.moving = false;
    await waitFor(() => expect(map.panBy).toHaveBeenCalledTimes(1));
  });

  it("leaves the map alone once the user moves it", async () => {
    const { map, mapRef, state, userMoves } = fakeMap();
    state.moving = true;

    renderKeepInView(mapRef, PHONE_COVER);
    userMoves();
    state.moving = false;

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(map.panBy).not.toHaveBeenCalled();
  });
});
