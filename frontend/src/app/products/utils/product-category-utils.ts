import { ProductResponse } from "@/lib/cijene-api/schemas";

export function getMostFrequentCategory(
  product: ProductResponse,
): string | null {
  if (!product.chains || product.chains.length === 0) {
    return null;
  }

  const categoryCount: Record<string, number> = {};

  for (const chain of product.chains) {
    if (chain.category) {
      categoryCount[chain.category] = (categoryCount[chain.category] || 0) + 1;
    }
  }

  let mostFrequentCategory: string | null = null;
  let maxCount = 0;

  for (const [category, count] of Object.entries(categoryCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentCategory = category;
    }
  }

  return mostFrequentCategory;
}
