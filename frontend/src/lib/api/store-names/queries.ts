import apiClient from "@/lib/api/api-base";
import { StoreNameSuggestion } from "@/lib/api/types";

export async function getStoreNameSuggestions(): Promise<
  StoreNameSuggestion[]
> {
  const response =
    await apiClient.get<StoreNameSuggestion[]>("/api/store-names");
  return response.data;
}
