"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/custom/search-bar";

interface ShoppingListSearchProps {
  onSearch?: (query: string) => void;
  showBarcode?: boolean;
  showSubmitButton?: boolean;
  submitLabel?: string;
}

export default function ShoppingListSearchBar({
  onSearch,
  showBarcode = true,
  showSubmitButton = false,
  submitLabel = "Pretraži shopping liste",
}: ShoppingListSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  function handleSearch(q: string) {
    if (q) {
      router.push(`/shopping-lists?q=${encodeURIComponent(q)}`);
    }

    onSearch?.(q);
  }

  return (
    <SearchBar
      defaultValue={initialQuery}
      placeholder="Pretraži shopping liste..."
      onSearch={handleSearch}
      showBarcode={showBarcode}
      clearable={true}
      showSubmitButton={showSubmitButton}
      submitLabel={submitLabel}
    />
  );
}
