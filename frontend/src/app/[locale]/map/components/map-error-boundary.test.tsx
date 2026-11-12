import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MapErrorBoundary from "@/app/[locale]/map/components/map-error-boundary";

const { reload } = vi.hoisted(() => ({ reload: vi.fn() }));

// jsdom cannot reload, so the real recovery runs with a recorded reload instead.
vi.mock("@/lib/pwa/chunk-load-recovery", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/pwa/chunk-load-recovery")>();
  return {
    ...actual,
    reloadAfterChunkLoadError: (error: unknown) =>
      actual.reloadAfterChunkLoadError(error, reload),
  };
});

function Throws({ error }: { error: Error }): never {
  throw error;
}

function renderThrowing(error: Error) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  render(
    <MapErrorBoundary fallback={<p>Karta nije dostupna</p>}>
      <Throws error={error} />
    </MapErrorBoundary>,
  );
}

describe("MapErrorBoundary", () => {
  it("reloads once when the map's chunk is gone after a deploy", () => {
    const error = Object.assign(new Error("Loading chunk 3fbffa26 failed."), {
      name: "ChunkLoadError",
    });

    renderThrowing(error);

    expect(reload).toHaveBeenCalledOnce();
  });

  it("shows the fallback without reloading when the map cannot start", () => {
    reload.mockClear();

    renderThrowing(new Error("WebGL2 is not supported"));

    expect(screen.getByText("Karta nije dostupna")).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });
});
