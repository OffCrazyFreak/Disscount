interface IStatsItem {
  id: string;
  ean?: string | null;
  amount?: number | null;
  isChecked: boolean;
  storePrice?: number | null;
  avgPrice?: number | null;
}

/** A plain item has no market price, so the price someone typed is exact, and the only one. */
function typedPriceOf(item: IStatsItem): number {
  return !item.ean && item.storePrice ? item.storePrice : 0;
}

interface IPriceRange {
  min: number;
  avg: number;
  max: number;
}

const NO_PRICE: IPriceRange = { min: 0, avg: 0, max: 0 };

/** A typed price is exact; an average is an estimate within 10 percent either way. */
function unitRangeOf(typedPrice: number, avgPrice: number): IPriceRange {
  if (typedPrice > 0)
    return { min: typedPrice, avg: typedPrice, max: typedPrice };
  if (avgPrice > 0) {
    return { min: avgPrice * 0.9, avg: avgPrice, max: avgPrice * 1.1 };
  }

  return NO_PRICE;
}

/** Total always uses API prices so it stays constant; spent uses DB prices for checked items. */
export function calculateShoppingListStats(
  items: IStatsItem[],
  averagePrices: Record<string, number>,
) {
  let minTotal = 0;
  let avgTotal = 0;
  let maxTotal = 0;
  let minToSpend = 0;
  let avgToSpend = 0;
  let maxToSpend = 0;
  let moneySpent = 0;
  // Typed prices have no average to beat, so they never count as saved or overpaid.
  let catalogSpent = 0;
  let potentialCostForChecked = 0;
  let checkedCount = 0;

  for (const item of items) {
    const amount = item.amount || 1;
    const typedPrice = typedPriceOf(item);
    const unit = unitRangeOf(typedPrice, averagePrices[item.id] || 0);

    minTotal += unit.min * amount;
    avgTotal += unit.avg * amount;
    maxTotal += unit.max * amount;

    if (!item.isChecked) {
      minToSpend += unit.min * amount;
      avgToSpend += unit.avg * amount;
      maxToSpend += unit.max * amount;
      continue;
    }

    const spent = (item.storePrice || 0) * amount;

    checkedCount++;
    moneySpent += spent;
    // Summed on its own, as subtracting the typed part back out leaves float residue that reads as overpaid.
    if (typedPrice === 0) catalogSpent += spent;
    potentialCostForChecked += (item.avgPrice || 0) * amount;
  }

  const savedAmount = potentialCostForChecked - catalogSpent;
  const savedPercentage =
    potentialCostForChecked > 0
      ? (savedAmount / potentialCostForChecked) * 100
      : 0;

  return {
    minTotal,
    avgTotal,
    maxTotal,
    minToSpend,
    avgToSpend,
    maxToSpend,
    moneySpent,
    catalogSpent,
    checkedCount,
    totalCount: items.length,
    savedAmount,
    savedPercentage,
    potentialCostForChecked,
  };
}

/** Plain items with no typed price, and products no store prices today, add nothing to the totals. */
export function countUnpricedItems(
  items: IStatsItem[],
  averagePrices: Record<string, number>,
): number {
  return items.filter(
    (item) => !(averagePrices[item.id] > 0) && typedPriceOf(item) === 0,
  ).length;
}
