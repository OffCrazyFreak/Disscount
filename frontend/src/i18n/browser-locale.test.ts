import { describe, expect, it } from "vitest";

import { browserLocale } from "@/i18n/browser-locale";

describe("browserLocale", () => {
  it("matches a regional tag on its primary language", () => {
    expect(browserLocale(["de-AT"])).toBe("de");
    expect(browserLocale(["EN-us"])).toBe("en");
  });

  it("takes the first supported language in preference order", () => {
    expect(browserLocale(["fr-FR", "sl-SI", "en"])).toBe("sl");
  });

  it("returns null when no preferred language has a catalog", () => {
    expect(browserLocale(["fr", "es-ES"])).toBeNull();
    expect(browserLocale([])).toBeNull();
  });
});
