import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { resetAuthToken } from "@/lib/api/api-base";

// Testing Library only unmounts on its own when afterEach is a global, and the
// suite imports it from vitest instead.
afterEach(() => {
  cleanup();
  document.cookie.split("; ").forEach((cookie) => {
    document.cookie = `${cookie.split("=")[0]}=; max-age=0; path=/`;
  });
  sessionStorage.clear();
  localStorage.clear();
  // The API client caches the token and a signed-out cooldown at module level.
  resetAuthToken();
});
