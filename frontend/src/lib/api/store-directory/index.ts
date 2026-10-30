import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import {
  StoreDirectoryResponse,
  storeDirectoryResponse,
} from "@/lib/api/schemas";

// Under the "cijene" prefix so the list persists for offline use like the
// rest of the public store data.
const STORE_DIRECTORY_QUERY_KEY = ["cijene", "store-directory"] as const;

async function getStoreDirectory(): Promise<StoreDirectoryResponse> {
  const response = await axios.get("/api/cijene/store-directory");

  return storeDirectoryResponse.parse(response.data);
}

export function useStoreDirectory() {
  return useQuery<StoreDirectoryResponse, Error>({
    queryKey: STORE_DIRECTORY_QUERY_KEY,
    queryFn: getStoreDirectory,
    staleTime: 60 * 60 * 1000,
  });
}
