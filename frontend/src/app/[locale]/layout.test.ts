import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Vitest cannot render the async root layout, so its markup is checked as source.
const layout = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

describe("root layout skip link", () => {
  it("renders the skip link before every other element in <body>", () => {
    const body = layout.slice(layout.indexOf("<body"));
    const firstElement = body
      .slice(body.indexOf(">") + 1)
      .match(/<[A-Za-z]\w*/);

    expect(firstElement?.[0]).toBe("<SkipLink");
  });

  it("gives <main> the target id and makes it focusable from script only", () => {
    const main = layout.match(/<main\s[^>]*>/)?.[0];

    expect(main).toContain("id={MAIN_CONTENT_ID}");
    expect(main).toContain("tabIndex={-1}");
  });
});
