import { ChainProductResponse } from "@/lib/cijene-api/schemas";

export type ChainSummary = ChainProductResponse & { itemCount: number };
