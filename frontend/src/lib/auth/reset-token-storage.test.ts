import { describe, expect, it, vi } from "vitest";

import {
  moveResetTokenOutOfUrl,
  readStoredResetToken,
} from "@/lib/auth/reset-token-storage";

function stubBrowser(url: string, storage: Storage = createStorage()) {
  const location = new URL(url);
  const replaceState = vi.fn(
    (_state: unknown, _unused: string, next: string) => {
      const nextUrl = new URL(next, location);
      location.search = nextUrl.search;
    },
  );

  vi.stubGlobal("window", {
    location,
    history: { state: { kept: true }, replaceState },
  });
  vi.stubGlobal("sessionStorage", storage);

  return { location, replaceState };
}

function createStorage(): Storage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    length: 0,
  };
}

describe("moveResetTokenOutOfUrl", () => {
  it("moves the token into session storage and keeps the modal param", () => {
    const { location, replaceState } = stubBrowser(
      "https://disscount.me/en?modal=reset-password&token=abc",
    );

    expect(moveResetTokenOutOfUrl()).toBe(false);

    expect(readStoredResetToken()).toBe("abc");
    expect(location.search).toBe("?modal=reset-password");
    expect(replaceState).toHaveBeenCalledWith(
      { kept: true },
      "",
      "/en?modal=reset-password",
    );
  });

  it("leaves the URL alone when storage is blocked, so the modal still has it", () => {
    const blocked = createStorage();
    blocked.setItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    const { location, replaceState } = stubBrowser(
      "https://disscount.me/?modal=reset-password&token=abc",
      blocked,
    );

    expect(moveResetTokenOutOfUrl()).toBe(true);

    expect(location.search).toBe("?modal=reset-password&token=abc");
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("ignores a token on any other page", () => {
    const { replaceState } = stubBrowser("https://disscount.me/?token=abc");

    expect(moveResetTokenOutOfUrl()).toBe(false);

    expect(readStoredResetToken()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
