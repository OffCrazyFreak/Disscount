import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import de from "@/i18n/messages/de/storeHours.json";
import en from "@/i18n/messages/en/storeHours.json";
import hr from "@/i18n/messages/hr/storeHours.json";
import it_ from "@/i18n/messages/it/storeHours.json";
import sl from "@/i18n/messages/sl/storeHours.json";

const CATALOGS = { hr, en, it: it_, sl, de };

function closingLine(locale: keyof typeof CATALOGS, day: string) {
  const t = createTranslator({
    locale,
    messages: { storeHours: CATALOGS[locale] },
    namespace: "storeHours",
  });
  const when = t("when", { day, time: "midnight" });

  return t("name.open", { time: "midnight", when });
}

describe("the midnight phrase in every catalog", () => {
  it.each([
    ["hr", "Otvoreno, zatvara u ponoć"],
    ["en", "Open, closes at midnight"],
    ["it", "Aperto, chiude a mezzanotte"],
    ["sl", "Odprto, zapre ob polnoči"],
    ["de", "Geöffnet, schließt um Mitternacht"],
  ] as const)("%s says a 24:00 closing today as %s", (locale, line) => {
    expect(closingLine(locale, "today")).toBe(line);
  });

  it("keeps the clock time for any other closing", () => {
    const t = createTranslator({
      locale: "it",
      messages: { storeHours: it_ },
      namespace: "storeHours",
    });

    expect(t("when", { day: "today", time: "21:00" })).toBe("alle 21:00");
  });
});
