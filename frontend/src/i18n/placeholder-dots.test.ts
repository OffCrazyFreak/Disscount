import { describe, expect, it } from "vitest";

import de from "@/i18n/messages/de";
import en from "@/i18n/messages/en";
import hr from "@/i18n/messages/hr";
import it_ from "@/i18n/messages/it";
import sl from "@/i18n/messages/sl";

const LOCALES = { hr, en, it: it_, sl, de };

function leafEntries(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (typeof value !== "object" || value === null) return [];

  return Object.entries(value).flatMap(([key, child]) =>
    leafEntries(child, path ? `${path}.${key}` : key),
  );
}

// Facet search fields hold their placeholder under a key named "search", and the shopping list picker shows its prompt as empty-state text.
function isPlaceholderKey(path: string) {
  return (
    /placeholder/i.test(path) ||
    /^products\.facets\.\w+\.search$/.test(path) ||
    /^products\.listTrigger\.(choose|createFirst)$/.test(path)
  );
}

describe("placeholder messages", () => {
  it.each(Object.entries(LOCALES))(
    "%s leaves the ellipsis to CSS, which only draws one on overflow",
    (_locale, messages) => {
      const typedDots = leafEntries(messages)
        .filter(([path]) => isPlaceholderKey(path))
        .filter(([, text]) => /(\.\.\.|…)$/.test(text))
        .map(([path]) => path);

      expect(typedDots).toEqual([]);
    },
  );
});
