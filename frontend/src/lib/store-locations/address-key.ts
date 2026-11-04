import { normalizeForSearch } from "@/utils/strings";

export interface IParsedAddress {
  /** Distinctive street words, e.g. ["franje", "tudmana"]. */
  tokens: string[];
  /** House number with its letter, e.g. "44a", or null for "bb" and unknown. */
  number: string | null;
}

// Words every spelling may add or drop, so they carry no signal when comparing two sources.
const NOISE = new Set([
  "ulica",
  "ul",
  "u",
  "cesta",
  "c",
  "trg",
  "put",
  "dr",
  "prof",
  "sv",
  "sveti",
  "sveta",
  "svetog",
  "svete",
  "kralja",
  "kraljice",
  "bana",
  "pape",
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "bb",
  "hr",
  "croatia",
  "hrvatska",
]);

export function normalizeCity(city: string | null | undefined): string {
  return normalizeForSearch(city ?? "")
    .replace(/\d+/g, " ")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseAddress(
  address: string | null | undefined,
): IParsedAddress {
  const words = normalizeForSearch(address ?? "")
    // "120/A" and "120 A" both mean house 120a
    .replace(/(\d+)\s*[/-]?\s*([a-z])\b/g, "$1$2")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let number: string | null = null;

  for (let index = words.length - 1; index >= 0; index--) {
    // A number before "bb" belongs to the street ("Ulica 1. svibnja bb").
    if (words[index] === "bb") break;

    if (/^\d+[a-z]?$/.test(words[index])) {
      // Upstream writes "0" where a street has no number, same as "bb".
      number = /^0+$/.test(words[index]) ? null : words[index];
      words.splice(index, 1);
      break;
    }
  }

  const tokens = words.filter((word) => word.length > 1 && !NOISE.has(word));

  return { tokens, number };
}

/** Most of the shorter street name must appear in the longer, since sources abbreviate first names or drop them. */
export function addressesMatch(a: IParsedAddress, b: IParsedAddress): boolean {
  if (!a.number || a.number !== b.number) return false;

  return streetsMatch(a.tokens, b.tokens);
}

/** With `initials`, a Croatian two-letter initial ("Lj." for Ljudevit) counts too. */
export function streetsMatch(
  a: string[],
  b: string[],
  initials = false,
): boolean {
  if (a.length === 0 || b.length === 0) return false;

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  const shared = shorter.filter((token) =>
    longer.some(
      (other) =>
        other === token ||
        isPrefixPair(other, token) ||
        (initials && isDigraphInitial(token, other)),
    ),
  ).length;

  return shared / shorter.length >= 0.6;
}

// Croatian writes lj, nj and dž as one letter, so "Lj. Gaja" abbreviates "Ljudevita Gaja" with two characters.
function isDigraphInitial(a: string, b: string): boolean {
  const [initial, word] = a.length <= b.length ? [a, b] : [b, a];

  return /^(lj|nj|dz)$/.test(initial) && word.startsWith(initial);
}

// Croatian declines street names, so a five-letter stem counts as the same word; sources also abbreviate, so a short prefix counts.
function isPrefixPair(a: string, b: string): boolean {
  if (startsOther(a, b)) return true;

  const stem = Math.min(a.length, b.length, 5);

  return stem >= 4 && a.slice(0, stem) === b.slice(0, stem);
}

/** The loosest rule: "Posavskog" and "Posavska" are different streets as often as one street declined. */
export function matchedOnlyByStem(a: string[], b: string[]): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  return shorter.some((token) => {
    if (longer.some((other) => other === token || startsOther(token, other)))
      return false;

    return longer.some((other) => isPrefixPair(token, other));
  });
}

function startsOther(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  return shorter.length >= 3 && longer.startsWith(shorter);
}

/** Some chains append a postcode and town or a store code and chain, which would otherwise read as the house number. */
export function cleanUpstreamAddress(address: string | null): string | null {
  if (!address) return address;

  return address
    .replace(/,\s*\d{5}\s+.*$/u, "")
    .replace(/\s+\d{4,6}\s+\p{L}+$/u, "")
    .trim();
}
