import apiClient from "@/lib/api/api-base";
import {
  storeNameSuggestionDtoSchema,
  type StoreNameSuggestionDto,
} from "@/lib/api/types";

export async function searchStoreNames(
  query: string,
): Promise<StoreNameSuggestionDto[]> {
  const response = await apiClient.get<unknown[]>("/api/store-names", {
    params: { q: query },
  });
  return response.data.map((item) => storeNameSuggestionDtoSchema.parse(item));
}
