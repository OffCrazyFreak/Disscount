import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import JsonLdScript from "@/components/custom/common/shell/json-ld-script";

const HOSTILE = {
  // U+2028 ends a line in older JavaScript parsers, so it must survive as data.
  name: "Sok </script><script>alert(1)</script> \u2028 kraj",
};

function scriptBody(html: string): string {
  const match = html.match(/^<script[^>]*>([\s\S]*)<\/script>$/);
  if (!match) throw new Error(`Not one script element: ${html}`);

  return match[1];
}

describe("JsonLdScript", () => {
  it("keeps a closing script tag in the data from ending the element", () => {
    const html = renderToStaticMarkup(<JsonLdScript data={HOSTILE} />);

    expect(scriptBody(html)).not.toMatch(/<\/script/i);
  });

  it("writes JSON that parses back to the data it was given", () => {
    const html = renderToStaticMarkup(<JsonLdScript data={HOSTILE} />);

    expect(JSON.parse(scriptBody(html))).toEqual(HOSTILE);
  });
});
