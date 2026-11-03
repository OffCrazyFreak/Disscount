import { afterEach, describe, expect, it, vi } from "vitest";

import { prepareAvatar } from "@/utils/browser/avatar-image";

interface IFakeCanvas {
  width: number;
  height: number;
  getContext: () => unknown;
  toBlob: (done: (blob: Blob | null) => void, type: string) => void;
}

// Safari answers a webp request with PNG, which the server refuses.
function safariCanvas(): IFakeCanvas {
  return {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
    }),
    toBlob: (done, type) =>
      done(
        new Blob(["x"], {
          type: type === "image/jpeg" ? "image/jpeg" : "image/png",
        }),
      ),
  };
}

function stubBrowser(canvas: IFakeCanvas) {
  const decode = vi.fn(async () => ({
    width: 4000,
    height: 3000,
    close: vi.fn(),
  }));
  vi.stubGlobal("createImageBitmap", decode);
  vi.stubGlobal("document", { createElement: () => canvas });
  return decode;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("prepareAvatar", () => {
  it("falls back to JPEG when the browser cannot encode WebP", async () => {
    stubBrowser(safariCanvas());

    const blob = await prepareAvatar(new File(["x"], "me.heic"));

    expect(blob.type).toBe("image/jpeg");
  });

  it("crops a square and applies the photo's EXIF rotation", async () => {
    const canvas = safariCanvas();
    const decode = stubBrowser(canvas);

    await prepareAvatar(new File(["x"], "me.jpg"));

    expect(decode).toHaveBeenCalledWith(expect.any(File), {
      imageOrientation: "from-image",
    });
    expect([canvas.width, canvas.height]).toEqual([256, 256]);
  });
});
