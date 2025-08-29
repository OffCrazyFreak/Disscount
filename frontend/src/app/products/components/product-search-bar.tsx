"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/custom/search-bar";

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
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }

    onSearch?.(q);
  }

  function handleBarcodeClick() {
    console.log("ProductSearchBar: barcode clicked");
    // TODO: open scanner UI and call handleSearch with scanned barcode
  }

  return (
    <SearchBar
      defaultValue={initialQuery}
      placeholder="Pretraži proizvode..."
      onSearch={handleSearch}
      onBarcodeClick={handleBarcodeClick}
      showBarcode={showBarcode}
      clearable={true}
      showSubmitButton={showSubmitButton}
      submitLabel={submitLabel}
    />
  );
}
