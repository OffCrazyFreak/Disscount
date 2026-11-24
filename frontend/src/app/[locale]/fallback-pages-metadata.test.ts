import { describe, expect, it, vi } from "vitest";

import { generateMetadata as notFoundMetadata } from "@/app/[locale]/not-found";
import { generateMetadata as offlineMetadata } from "@/app/[locale]/offline/page";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

describe("fallback page metadata", () => {
  it("gives a 404 no canonical and leaves the one noindex to Next", async () => {
    const metadata = await notFoundMetadata();

    expect(metadata.alternates).toBeNull();
    expect(metadata.robots).toBeNull();
  });

  it("keeps the offline fallback unindexed with no canonical", async () => {
    const metadata = await offlineMetadata();

    expect(metadata.alternates).toBeNull();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
