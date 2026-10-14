export {
  getMinPrice,
  getMaxPrice,
  getAveragePrice,
  getChainAvgPriceRange,
} from "@/utils/product-price-utils";

export {
  getPricePerUnit,
  getMinPricePerUnit,
  getMaxPricePerUnit,
  getAveragePricePerUnit,
} from "@/app/[locale]/products/utils/product-unit-price-utils";

export {
  getPriceExtreme,
  calculatePriceChange,
} from "@/app/[locale]/products/utils/price-comparison-utils";

export type { PriceExtreme } from "@/app/[locale]/products/utils/price-comparison-types";

export { getMostFrequentCategory } from "@/app/[locale]/products/utils/product-category-utils";
