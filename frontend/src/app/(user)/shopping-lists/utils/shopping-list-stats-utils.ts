/**
 * Calculate shopping list price statistics
 * Total always uses API prices to remain constant
 * Spent uses DB prices for checked items
 */
export function calculateShoppingListStats(
  items: Array<{
    id: string;
    amount?: number | null;
    isChecked: boolean;
    storePrice?: number | null;
    avgPrice?: number | null;
  }>,
  averagePrices: Record<string, number>,
) {
  let minTotal = 0;
  let avgTotal = 0;
  let maxTotal = 0;
  let minToSpend = 0;
  let avgToSpend = 0;
  let maxToSpend = 0;
  let moneySpent = 0;
  let potentialCostForChecked = 0;
  let checkedCount = 0;

  for (const item of items) {
    const amount = item.amount || 1;
    const avgPrice = averagePrices[item.id] || 0;

    // Total always uses API prices (estimations)
    if (avgPrice > 0) {
      const estimatedMin = avgPrice * 0.9;
      const estimatedMax = avgPrice * 1.1;

      minTotal += estimatedMin * amount;
      avgTotal += avgPrice * amount;
      maxTotal += estimatedMax * amount;
    }

    if (item.isChecked) {
      checkedCount++;
      const itemPrice = item.storePrice || 0;
      const itemAvgPrice = item.avgPrice || 0;

      moneySpent += itemPrice * amount;
      potentialCostForChecked += itemAvgPrice * amount;
    } else {
      // For unchecked items, calculate remaining to spend
      if (avgPrice > 0) {
        const estimatedMin = avgPrice * 0.9;
        const estimatedMax = avgPrice * 1.1;

        minToSpend += estimatedMin * amount;
        avgToSpend += avgPrice * amount;
        maxToSpend += estimatedMax * amount;
      }
    }
  }

  const savedAmount = potentialCostForChecked - moneySpent;
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
    checkedCount,
    totalCount: items.length,
    savedAmount,
    savedPercentage,
    potentialCostForChecked,
  };
}
