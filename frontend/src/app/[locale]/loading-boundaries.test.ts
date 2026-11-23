import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const LOCALE_DIR = __dirname;

// Each of these calls notFound(), which only keeps its 404 when no loading file above it streamed a 200 first.
const NOT_FOUND_PAGES = [
  "categories/[slug]",
  "products/[id]",
  "suggestions/[id]",
  "updates/[id]",
  "[...rest]",
];

function foldersFromLocaleTo(page: string) {
  const segments = page.split("/");

  return segments.map((_, index) =>
    path.join(LOCALE_DIR, ...segments.slice(0, index + 1)),
  );
}

describe("loading files above pages that can 404", () => {
  it.each(NOT_FOUND_PAGES)("puts none above %s", (page) => {
    const folders = [LOCALE_DIR, ...foldersFromLocaleTo(page)];

    expect(existsSync(path.join(LOCALE_DIR, page, "page.tsx"))).toBe(true);
    expect(
      folders.filter((folder) => existsSync(path.join(folder, "loading.tsx"))),
    ).toEqual([]);
  });
});
