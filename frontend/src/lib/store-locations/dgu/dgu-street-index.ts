import {
  addressesMatch,
  parseAddress,
  type IParsedAddress,
} from "@/lib/store-locations/address-key";

// Two street words can only match when their first four letters agree
// (see isPrefixPair in address-key), so that prefix is a safe lookup key.
const STEM = 4;

export interface IStreetIndex {
  /** A street entry's tokens, plus the targets whose street it may be. */
  match(streetName: string): { tokens: string[]; targets: number[] } | null;
}

/** Street name tokens, with a sentinel number so a trailing digit stays a word. */
export function streetTokens(streetName: string): string[] {
  return parseAddress(`${streetName} 0`).tokens;
}

export function createStreetIndex(parsed: IParsedAddress[]): IStreetIndex {
  const byStem = new Map<string, number[]>();

  parsed.forEach((address, index) => {
    if (!address.number) return;

    for (const token of address.tokens) {
      const stem = token.slice(0, STEM);
      const list = byStem.get(stem);

      if (list) list.push(index);
      else byStem.set(stem, [index]);
    }
  });

  return {
    match(streetName) {
      const tokens = streetTokens(streetName);
      const candidates = new Set<number>();

      for (const token of tokens) {
        for (const index of byStem.get(token.slice(0, STEM)) ?? []) {
          candidates.add(index);
        }
      }

      const targets = [...candidates].filter((index) =>
        addressesMatch(
          { tokens: parsed[index].tokens, number: "0" },
          { tokens, number: "0" },
        ),
      );

      return targets.length > 0 ? { tokens, targets } : null;
    },
  };
}
