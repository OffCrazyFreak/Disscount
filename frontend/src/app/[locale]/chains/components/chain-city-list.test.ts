import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ChainCityList from "@/app/[locale]/chains/components/chain-city-list";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, values?: { count: number }) =>
    values ? `${key}:${values.count}` : key,
}));

function cities(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    city: `Mjesto ${index + 1}`,
    storeCount: count - index,
  }));
}

// A .ts test, so the async server component runs uncompiled, as Next renders it on the server.
async function renderList(count: number) {
  const html = renderToStaticMarkup(
    await ChainCityList({ cities: cities(count) }),
  );
  const [shown, folded = ""] = html.split("<details");

  return { shown, folded };
}

function itemCount(html: string) {
  return html.match(/<li /g)?.length ?? 0;
}

describe("ChainCityList", () => {
  it("shows the top 20 places and keeps the rest in a closed disclosure", async () => {
    const { shown, folded } = await renderList(287);

    expect(itemCount(shown)).toBe(20);
    expect(shown).toContain(">Mjesto 20<");
    expect(shown).not.toContain(">Mjesto 21<");

    expect(folded).not.toMatch(/^[^>]*\sopen/);
    expect(folded).toContain("cities.showMore:267");
    expect(itemCount(folded)).toBe(267);
    expect(folded).toContain(">Mjesto 287<");
  });

  it("leaves out the disclosure when every place fits", async () => {
    const { shown, folded } = await renderList(20);

    expect(itemCount(shown)).toBe(20);
    expect(folded).toBe("");
  });
});
