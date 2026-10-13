import { ProductResponse } from "@/lib/cijene-api/schemas";

export type HistoryDataPoint = {
  date: string;
  product: ProductResponse;
};
