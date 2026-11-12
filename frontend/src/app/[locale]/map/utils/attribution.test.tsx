import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { foldAttributionLater } from "@/app/[locale]/map/utils/attribution";

type IHandler = (event: { originalEvent?: Event }) => void;

function setup() {
  const container = document.createElement("div");
  container.innerHTML =
    '<details class="maplibregl-ctrl-attrib maplibregl-compact maplibregl-compact-show"></details>';
  const handlers: Record<string, IHandler[]> = {};
  const add = (name: string, handler: IHandler) => {
    (handlers[name] ??= []).push(handler);
  };
  const map = {
    getContainer: () => container,
    on: add,
    once: add,
  } as unknown as MapLibreMap;

  foldAttributionLater(map);

  const credits = container.querySelector("details");
  return {
    isOpen: () => credits?.classList.contains("maplibregl-compact-show"),
    fire: (name: string, event = {}) =>
      handlers[name]?.forEach((handler) => handler(event)),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("foldAttributionLater", () => {
  it("shows the credits, then folds them 5 seconds after the map settles", () => {
    vi.useFakeTimers();
    const { isOpen, fire } = setup();

    fire("idle");
    vi.advanceTimersByTime(4999);
    expect(isOpen()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(isOpen()).toBe(false);
  });

  it("folds them at once when the user pans or zooms, not on our own moves", () => {
    const { isOpen, fire } = setup();

    fire("movestart");
    expect(isOpen()).toBe(true);

    fire("movestart", { originalEvent: new Event("wheel") });
    expect(isOpen()).toBe(false);
  });
});
