"use client";

import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import NoResults from "@/components/custom/common/no-results";
import ProductItem from "@/app/products/components/product-item/product-item";
import { useIsMobile } from "@/hooks/use-mobile";
import { useViewMode } from "@/hooks/use-view-mode";
import type { ProductResponse } from "@/lib/cijene-api/schemas";

const ICON_CLASS = "size-12 text-gray-400 mx-auto mb-4";

interface IProductResultsProps {
  query: string;
  products: ProductResponse[];
  total: number;
  isTruncated: boolean;
  isLoading: boolean;
  error: unknown;
  activeFilterCount: number;
  onClearFilters: () => void;
}

export default function ProductResults({
  query,
  products,
  total,
  isTruncated,
  isLoading,
  error,
  activeFilterCount,
  onClearFilters,
}: IProductResultsProps) {
  const isMobile = useIsMobile();
  const [viewMode] = useViewMode(usePathname());

  const asList = viewMode !== "grid" || isMobile;

  return (
    <>
      <h3>
        {query.length > 0 &&
          `Rezultati pretrage za "${query}"${
            isLoading ? "" : ` (${total}${isTruncated ? "+" : ""})`
          }`}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <BlockLoadingSpinner />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <Search className="mx-auto mb-4 size-12 text-red-700" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Greška pri pretraživanju
          </h3>
          <p className="mb-6 text-gray-600">
            Došlo je do greške pri dohvaćanju podataka. Pokušaj ponovo.
          </p>
        </div>
      ) : query && total === 0 && activeFilterCount > 0 ? (
        <div>
          <NoResults
            icon={<Search className={ICON_CLASS} />}
            description="Nema rezultata za odabrane filtere"
          />

          <div className="text-center">
            <Button type="button" variant="outline" onClick={onClearFilters}>
              Očisti filtere
            </Button>
          </div>
        </div>
      ) : query && total === 0 ? (
        <NoResults icon={<Search className={ICON_CLASS} />} />
      ) : query ? (
        <div
          className={
            asList ? "space-y-4" : "grid grid-cols-2 gap-4 sm:grid-cols-3"
          }
        >
          {products.map((product) => (
            <div key={product.ean} className={asList ? "w-full" : "w-76"}>
              <ProductItem product={product} />
            </div>
          ))}
        </div>
      ) : activeFilterCount > 0 ? (
        <div className="py-12 text-center">
          <SlidersHorizontal className={ICON_CLASS} />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Unesi pojam za pretragu
          </h3>
          <p className="mb-6 text-gray-600">
            Filteri su postavljeni, rezultati će se prikazati nakon pretrage
          </p>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Search className={ICON_CLASS} />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Pretraži proizvode
          </h3>
          <p className="mb-6 text-gray-600">
            Unesi naziv proizvoda koji tražiš
          </p>
        </div>
      )}
    </>
  );
}
