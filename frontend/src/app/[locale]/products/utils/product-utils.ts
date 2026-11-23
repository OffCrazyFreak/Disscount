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
  type PriceExtreme,
} from "@/utils/price-comparison";

export { getMostFrequentCategory } from "@/app/[locale]/products/utils/product-category-utils";
