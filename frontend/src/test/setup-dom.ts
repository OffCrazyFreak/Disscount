import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { serverSession } from "@/test/backend-identity";

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
