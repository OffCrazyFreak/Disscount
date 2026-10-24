import { normalizeForSearch } from "@/utils/strings";

/** An address reduced to what two spellings of it have in common. */
export interface IParsedAddress {
  /** Distinctive street words, e.g. ["franje", "tudmana"]. */
  tokens: string[];
  /** House number with its letter, e.g. "44a", or null for "bb" and unknown. */
  number: string | null;
}

// Words every spelling may add or drop ("Ulica Ilica", "Ul. Ilica", "Ilica"),
// so they carry no signal when comparing two sources.
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

/**
 * Whether two addresses name the same building: same house number, and most of
 * the shorter street name appears in the longer one, since sources abbreviate
 * first names ("F. Tuđmana") or drop them altogether.
 */
export function addressesMatch(a: IParsedAddress, b: IParsedAddress): boolean {
  if (!a.number || a.number !== b.number) return false;

  return streetsMatch(a.tokens, b.tokens);
}

/**
 * Whether most of the shorter street name appears in the longer one. With
 * `initials`, a Croatian two-letter initial ("Lj." for Ljudevit) counts too.
 */
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

// Croatian writes lj, nj and dž as one letter, so "Lj. Gaja" abbreviates
// "Ljudevita Gaja" with two characters.
function isDigraphInitial(a: string, b: string): boolean {
  const [initial, word] = a.length <= b.length ? [a, b] : [b, a];

  return /^(lj|nj|dz)$/.test(initial) && word.startsWith(initial);
}

// Croatian declines street names ("Vukovarska" vs "Vukovarske"), so a shared
// stem of five letters counts as the same word. Sources also abbreviate
// ("Set." for "Šetalište"), so a short word that starts the other one counts.
function isPrefixPair(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  if (shorter.length >= 3 && longer.startsWith(shorter)) return true;

  const stem = Math.min(a.length, b.length, 5);

  return stem >= 4 && a.slice(0, stem) === b.slice(0, stem);
}

/**
 * Strips what some chains append to the upstream address: a postcode and town
 * ("Stepinca 8B, 10290 Zaprešić") or a store code and chain ("Savska 58 87079
 * Spar"), either of which would otherwise be read as the house number.
 */
export function cleanUpstreamAddress(address: string | null): string | null {
  if (!address) return address;

  return address
    .replace(/,\s*\d{5}\s+.*$/u, "")
    .replace(/\s+\d{4,6}\s+\p{L}+$/u, "")
    .trim();
}
