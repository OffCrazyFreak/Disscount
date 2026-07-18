import { ChainProductResponse } from "@/lib/cijene-api/schemas";

export type ChainSummary = ChainProductResponse & { itemCount: number };

export interface ICompleteStoresAnalysis {
  bestStore: ChainSummary | null;
  worstStore: ChainSummary | null;
}
