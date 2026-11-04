import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { type AxeResultsLike, toHaveNoViolations } from "vi-axe";
import type {} from "vi-axe/extend-expect";
import { afterEach, expect } from "vitest";

import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { serverSession } from "@/test/backend-identity";

// The matcher's message may be undefined, which Vitest's type does not allow.
expect.extend({
  toHaveNoViolations(results: AxeResultsLike) {
    const { pass, message } = toHaveNoViolations.toHaveNoViolations(results);

    return { pass, message: () => message() ?? "" };
  },
});

// The 1 s findBy and waitFor default is too tight for jsdom on a loaded machine; a passing query
// returns at once, so the larger limit only delays a test that was going to fail.
configure({ asyncUtilTimeout: 10_000 });

// Testing Library only unmounts on its own when afterEach is a global, and the
// suite imports it from vitest instead.
afterEach(() => {
  cleanup();
  document.cookie.split("; ").forEach((cookie) => {
    document.cookie = `${cookie.split("=")[0]}=; max-age=0; path=/`;
  });
  sessionStorage.clear();
  localStorage.clear();
  // The in-memory cache identity is the proxy pin, and outlives the localStorage cleared above.
  setCacheIdentity(null);
  serverSession.userId = null;
});

// jsdom logs "not implemented" on every canvas call; null is what it returns anyway,
// and callers treat it as "cannot measure text".
HTMLCanvasElement.prototype.getContext = () => null;

// jsdom has neither API. Components only need them to exist; a test that needs real answers
// overrides these with vi.stubGlobal, which restores this default afterwards.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

window.matchMedia ??= () =>
  ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;
