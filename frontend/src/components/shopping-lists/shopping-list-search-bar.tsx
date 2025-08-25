"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/search-bar";

interface ProductSearchBarProps {
  onSearch?: (query: string) => void;
  showBarcode?: boolean;
  showSubmitButton?: boolean;
  submitLabel?: string;
}

export default function ProductSearchBar({
  onSearch,
  showBarcode = true,
  showSubmitButton = false,
  submitLabel = "Pretraži proizvode",
}: ProductSearchBarProps) {
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
