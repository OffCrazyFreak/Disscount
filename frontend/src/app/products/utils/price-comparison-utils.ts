export type PriceExtreme = "min" | "max" | null;

// Uniform prices (min === max) return null so every view renders them neutrally.
export function getPriceExtreme(
  value: number,
  min: number,
  max: number,
): PriceExtreme {
  if (![value, min, max].every(Number.isFinite)) {
    return null;
  }

  if (min === max) {
    return null;
  }

  if (value === min) {
    return "min";
  }

  if (value === max) {
    return "max";
  }

  return null;
}

export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number,
) {
  const percentage = Math.abs(
    ((currentPrice - previousPrice) / previousPrice) * 100,
  );
  const difference = Number((currentPrice - previousPrice).toFixed(2));

  return { percentage, difference };
}
