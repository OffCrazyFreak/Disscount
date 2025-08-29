"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button-icon";
import { ListPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ProductResponse } from "@/app/products/api/schemas";
import {
  getPriceRange,
  getMinPrice,
  getAveragePrice,
} from "@/app/products/api/utils";

// Trim trailing zeros from decimal quantities: "1.000" -> "1", "1.200" -> "1.2"
function formatQuantity(q?: string | null) {
  if (!q) return q;
  // Only trim trailing zeros when a decimal point exists (avoid changing integers like "100")
  if (q.includes(".")) {
    let trimmed = q.replace(/0+$/g, "");
    if (trimmed.endsWith(".")) trimmed = trimmed.slice(0, -1);
    return trimmed;
  }
  return q;
}

interface ProductCardProps {
  product: ProductResponse;
  onAddToList?: (id: number | string) => void;
}

export default function ProductCard({
  product,
  onAddToList,
}: ProductCardProps) {
  const router = useRouter();

  const priceRange = getPriceRange(product);
  const minPrice = getMinPrice(product);
  const averagePrice = getAveragePrice(product);

  // Get category from first chain
  const category = product.chains[0]?.category;

  return (
    <Card className="px-6 py-4 hover:shadow-md hover:scale-101 transition-shadow transition-transform">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          {/* Product Image */}
          <div className="size-20 bg-gray-100 rounded-lg hidden sm:grid place-items-center">
            <span className="text-gray-400">IMG</span>
          </div>

          {/* Product Info */}
          <div className="">
            {category && (
              <div
                className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={(ev: React.MouseEvent) => {
                  ev.stopPropagation();

                  router.push(
                    `/products?filterBy=category:${encodeURIComponent(
                      category || ""
                    )}`
                  );
                }}
              >
                {category}
              </div>
            )}

            <h3
              className="font-bold"
              onClick={(ev: React.MouseEvent) => {
                // Prevent the card click handler from firing
                ev.stopPropagation();
              }}
            >
              {product.name}
            </h3>
            {product.brand && (
              <div
                className="text-sm"
                onClick={(ev: React.MouseEvent) => {
                  // Prevent the card click handler from firing
                  ev.stopPropagation();
                }}
              >
                {product.brand}
              </div>
            )}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center justify-center flex-col sm:flex-row gap-2 sm:gap-4">
            {product.quantity && product.unit && (
              <div className="text-center text-gray-700">
                <div className="">
                  {formatQuantity(product.quantity) + " " + product.unit}
                </div>
                {/* <div className="hidden sm:block">|</div> */}
              </div>
            )}

            {minPrice !== undefined && averagePrice !== undefined ? (
              <div className=" font-bold text-md text-center">
                <div className="text-green-600">{minPrice.toFixed(2)}€</div>

                <Separator className="px-10 mb-1" />

                <div className="text-xs text-gray-500">
                  {averagePrice.toFixed(2)}€
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Nepoznata cijena</div>
            )}
          </div>
          <Button
            variant="default"
            className="p-2 size-12"
            onClick={(ev: React.MouseEvent) => {
              ev.stopPropagation();

              onAddToList?.(product.ean);
            }}
          >
            <ListPlus className="size-7" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
