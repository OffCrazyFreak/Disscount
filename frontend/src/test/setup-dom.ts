import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { serverSession } from "@/test/backend-identity";

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
