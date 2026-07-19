import {
  listChains,
  listStoresByChain,
  searchStores,
  getProductByEan,
  getProductByName,
  getPrices,
  getChainStats,
  healthCheck,
} from "@/lib/cijene-api/queries";
import {
  useListChains,
  useListStoresByChain,
  useSearchStores,
  useGetProductByEan,
  useGetProductByName,
  useGetPrices,
  useGetChainStats,
  useHealthCheck,
} from "@/lib/cijene-api/query-hooks";

export * from "@/lib/cijene-api/queries";
export * from "@/lib/cijene-api/query-hooks";

const cijeneService = {
  listChains,
  listStoresByChain,
  searchStores,
  getProductByEan,
  getProductByName,
  getPrices,
  getChainStats,
  healthCheck,
  useListChains,
  useListStoresByChain,
  useSearchStores,
  useGetProductByEan,
  useGetProductByName,
  useGetPrices,
  useGetChainStats,
  useHealthCheck,
};

export default cijeneService;
