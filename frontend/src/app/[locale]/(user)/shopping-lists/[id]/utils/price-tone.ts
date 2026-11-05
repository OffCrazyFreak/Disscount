export interface IPriceTones {
  low: string;
  high: string;
  neutral: string;
}

/** Picks the class for a price that may be the lowest or highest across chains. */
export function priceTone(
  tones: IPriceTones,
  isLowestPrice: boolean,
  isHighestPrice: boolean,
): string {
  if (isLowestPrice) return tones.low;
  if (isHighestPrice) return tones.high;
  return tones.neutral;
}
