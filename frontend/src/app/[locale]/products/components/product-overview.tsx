"use client";

import { ProductResponse } from "@/lib/cijene-api/schemas";
import ProductPhotoGallery from "@/app/[locale]/products/components/product-photos/product-photo-gallery";
import {
  type IProductInfoField,
  useProductInfoFields,
} from "@/app/[locale]/products/hooks/use-product-info-fields";
import { cn } from "@/lib/utils";

interface IProductOverviewProps {
  product: ProductResponse;
  displayName: string;
}

// The photo takes its natural height so every cell keeps its padding, and the facts list is a subgrid: an L on narrow screens, a table on wide ones.
const GRID =
  "[--gap:0.5rem] grid grid-cols-[auto_minmax(0,1fr)] gap-x-(--gap) md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-0";

const CARD = "border border-gray-300 bg-background";

export default function ProductOverview({
  product,
  displayName,
}: IProductOverviewProps) {
  const { brand, barcode, quantity, prices, unitPrices } =
    useProductInfoFields(product);
  const hasLower = Boolean(prices || unitPrices);

  // Where each fact sits: an L around the photo on narrow screens, a two-column table on wide ones.
  const cells: [IProductInfoField | null, string][] = [
    [
      brand,
      cn(
        "col-start-2 row-start-1 border-b border-gray-200 md:border-r",
        // From md up a lone first row is also the card's last, whose edge is the outline's.
        !(quantity || prices) && "md:border-b-0",
      ),
    ],
    [
      barcode,
      cn(
        "col-start-2 row-start-2 md:col-start-3 md:row-start-1",
        (quantity || hasLower) && "border-b border-gray-200",
      ),
    ],
    [
      quantity,
      cn(
        "col-start-2 row-start-3 md:row-start-2 md:border-r md:border-gray-200",
        unitPrices && "md:border-b",
      ),
    ],
    [
      prices,
      cn(
        "col-span-full row-start-4 md:col-span-1 md:col-start-3 md:row-start-2",
        unitPrices && "border-b border-gray-200",
      ),
    ],
    [
      unitPrices,
      "col-span-full row-start-5 md:col-span-2 md:col-start-2 md:row-start-3",
    ],
  ];

  return (
    <div className={GRID}>
      <ProductPhotoGallery
        ean={product.ean}
        productName={displayName}
        // Above the facts subgrid; on wide screens the photo carries the spacing, because a column gap would also split the table's columns.
        className={cn(
          "relative z-[3] col-start-1 row-span-3 row-start-1 md:mr-3 md:mb-0",
          hasLower && "mb-(--gap)",
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          CARD,
          "relative z-[1] col-start-2 row-span-3 row-start-1 rounded-t-xl md:hidden",
          hasLower ? "border-b-0" : "rounded-b-xl",
        )}
      />
      {hasLower && (
        <div
          aria-hidden="true"
          className={cn(
            CARD,
            "relative col-span-full row-span-2 row-start-4 rounded-tl-xl rounded-b-xl md:hidden",
          )}
        />
      )}
      {hasLower && (
        // Rounds the inside corner where the two parts meet, anchored where the facts column starts.
        <div
          aria-hidden="true"
          className="relative col-start-2 row-start-4 size-0 self-start md:hidden"
        >
          <span className="absolute -top-[calc(var(--radius-xl)+1px)] -left-[calc(var(--radius-xl)+1px)] z-[3] h-[calc(var(--radius-xl)+1px)] w-[calc(var(--radius-xl)+2px)] bg-[radial-gradient(circle_at_0_0,transparent_calc(var(--radius-xl)+1px),var(--color-gray-300)_calc(var(--radius-xl)+1px),var(--color-gray-300)_calc(var(--radius-xl)+2px),var(--background)_calc(var(--radius-xl)+2px))]" />
        </div>
      )}
      <div
        aria-hidden="true"
        className={cn(
          CARD,
          "hidden rounded-xl shadow-2xs md:col-span-2 md:col-start-2 md:row-span-3 md:row-start-1 md:block",
        )}
      />

      <dl className="relative z-[2] col-span-full row-[1/6] grid grid-cols-subgrid grid-rows-subgrid md:row-[1/4]">
        {cells.map(
          ([field, className]) =>
            field && (
              <div
                key={field.label}
                className={cn("content-center p-2 text-sm", className)}
              >
                <dt className="inline font-bold">{field.label}</dt>{" "}
                <dd className="inline">{field.value}</dd>
              </div>
            ),
        )}
      </dl>
    </div>
  );
}
