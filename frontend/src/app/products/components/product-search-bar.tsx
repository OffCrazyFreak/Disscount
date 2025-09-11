"use client";

import { memo, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/custom/search-bar";
import BarcodeScanner from "@/components/custom/barcode-scanner";
import { useSidebar } from "@/components/ui/sidebar";

interface ProductSearchBarProps {
  onSearch?: (query: string) => void;
  showBarcode?: boolean;
  showSubmitButton?: boolean;
  submitLabel?: string;
}

export const ProductSearchBar = memo(function ProductSearchBar({
  onSearch,
  showBarcode = true,
  showSubmitButton = false,
  submitLabel = "Pretraži proizvode",
}: ProductSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [scannerOpen, setScannerOpen] = useState(false);
  const { setOpen } = useSidebar();

  const handleSearch = useCallback(
    (q: string) => {
      if (q) {
        router.push(`/products?q=${encodeURIComponent(q)}`);

        setOpen(false);
      }

      onSearch?.(q);
    },
    [router, onSearch]
  );

  const handleBarcodeClick = useCallback(() => {
    console.log("ProductSearchBar: barcode clicked");
    setScannerOpen(true);
  }, []);

  const handleScan = useCallback(
    (result: string) => {
      handleSearch(result);

      setOpen(false);
    },
    [handleSearch, setOpen]
  );

  return (
    <>
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
    </>
  );
});
