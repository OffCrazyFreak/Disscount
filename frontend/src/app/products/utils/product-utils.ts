export {
  parsePrice,
  getMinPrice,
  getMaxPrice,
  getAveragePrice,
  getCheapestChainByMinPrice,
} from "@/app/products/utils/product-price-utils";

export {
  getMinPricePerUnit,
  getMaxPricePerUnit,
  getAveragePricePerUnit,
} from "@/app/products/utils/product-unit-price-utils";

export {
  getPriceExtreme,
  calculatePriceChange,
} from "@/app/products/utils/price-comparison-utils";

export type { PriceExtreme } from "@/app/products/utils/price-comparison-types";

export { getMostFrequentCategory } from "@/app/products/utils/product-category-utils";
