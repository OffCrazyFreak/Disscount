import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isChunkLoadError,
  reloadAfterChunkLoadError,
} from "@/lib/pwa/chunk-load-recovery";

function chunkLoadError() {
  const error = new Error("Loading chunk 6506 failed.\n(error: /x.js)");
  error.name = "ChunkLoadError";
  return error;
}

describe("isChunkLoadError", () => {
  it("recognises webpack's script and CSS chunk failures", () => {
    expect(isChunkLoadError(chunkLoadError())).toBe(true);
    expect(isChunkLoadError(new Error("Loading CSS chunk 812 failed."))).toBe(
      true,
    );
  });

  it("ignores other errors and non-errors", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError("Loading chunk 1 failed")).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe("reloadAfterChunkLoadError", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });

  afterEach(() => {
    store.clear();
    vi.unstubAllGlobals();
  });

  it("reloads on the first chunk failure", () => {
    const reload = vi.fn();

    expect(reloadAfterChunkLoadError(chunkLoadError(), reload, 1_000)).toBe(
      true,
    );
    expect(reload).toHaveBeenCalledOnce();
  });

  it("does not reload again when the fresh page fails too", () => {
    const reload = vi.fn();

    reloadAfterChunkLoadError(chunkLoadError(), reload, 1_000);
    const reloadedAgain = reloadAfterChunkLoadError(
      chunkLoadError(),
      reload,
      5_000,
    );

    expect(reloadedAgain).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("recovers again from a later deploy once the cooldown has passed", () => {
    const reload = vi.fn();

    reloadAfterChunkLoadError(chunkLoadError(), reload, 1_000);
    reloadAfterChunkLoadError(chunkLoadError(), reload, 1_000 + 61_000);

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("leaves other errors to the boundary", () => {
    const reload = vi.fn();

    expect(reloadAfterChunkLoadError(new Error("boom"), reload, 1_000)).toBe(
      false,
    );
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not reload when storage is unavailable, since nothing could stop a loop", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    });
    const reload = vi.fn();

    expect(reloadAfterChunkLoadError(chunkLoadError(), reload, 1_000)).toBe(
      false,
    );
    expect(reload).not.toHaveBeenCalled();
  });
});
