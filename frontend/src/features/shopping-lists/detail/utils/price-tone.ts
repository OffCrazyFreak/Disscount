export interface IPriceTones {
  low: string;
  high: string;
  neutral: string;
}

export function priceTone(
  tones: IPriceTones,
  isLowestPrice: boolean,
  isHighestPrice: boolean,
): string {
  if (isLowestPrice) return tones.low;
  if (isHighestPrice) return tones.high;
  return tones.neutral;
}
