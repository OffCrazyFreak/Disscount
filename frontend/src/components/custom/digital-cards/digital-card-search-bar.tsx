"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/custom/search-bar";

interface DigitalCardSearchBarProps {
  onSearch?: (query: string) => void;
  showBarcode?: boolean;
  showSubmitButton?: boolean;
  submitLabel?: string;
}

export default function DigitalCardSearchBar({
  onSearch,
  showBarcode = false,
  showSubmitButton = false,
  submitLabel = "Pretraži digitalne kartice",
}: DigitalCardSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  function handleSearch(q: string) {
    if (q) {
      router.push(`/digital-cards?q=${encodeURIComponent(q)}`);
    }

    onSearch?.(q);
  }

  return (
    <SearchBar
      defaultValue={initialQuery}
      placeholder="Pretraži digitalne kartice..."
      onSearch={handleSearch}
      showBarcode={showBarcode}
      clearable={true}
      showSubmitButton={showSubmitButton}
      submitLabel={submitLabel}
    />
  );
}
