"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListPlus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { normalizeForSearch } from "@/lib/searchUtils";

export interface ProductItem {
  id: number | string;
  name: string;
  category: string;
  brand: string;
  quantity?: string;
  averagePrice?: number;
  image?: string;
}

interface ProductCardProps {
  product: ProductItem;
  onAddToList?: (id: number | string) => void;
}

export default function ProductCard({
  product,
  onAddToList,
}: ProductCardProps) {
  const router = useRouter();

  return (
    <Card
      className="px-6 py-4 hover:shadow-md hover:scale-101 transition-shadow transition-transform cursor-pointer"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          {/* Product Image */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg  hidden sm:grid place-items-center">
            <span className="text-gray-400 text-xs">IMG</span>
          </div>

          {/* Product Info */}
          <div className="">
            <div
              className="text-sm text-gray-500"
              onClick={(ev: React.MouseEvent) => {
                ev.stopPropagation();

                router.push(
                  `/products?filterBy=category:${encodeURIComponent(
                    product.category
                  )}`
                );
              }}
            >
              {product.category}
            </div>

            <h3
              className="font-semibold text-lg"
              onClick={(ev: React.MouseEvent) => {
                // Prevent the card click handler from firing
                ev.stopPropagation();
              }}
            >
              {product.name}
            </h3>
            <div
              className="text-sm"
              onClick={(ev: React.MouseEvent) => {
                // Prevent the card click handler from firing
                ev.stopPropagation();
              }}
            >
              {product.brand}
            </div>
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center justify-center flex-col sm:flex-row gap-0 sm:gap-2">
            <div className="">{product.quantity}</div>
            <div className="hidden sm:block">~</div>
            <div className="font-bold text-lg">
              €{(product.averagePrice ?? 0).toFixed(2)}
            </div>
          </div>
          <Button
            variant="default"
            className="p-2"
            onClick={(ev: React.MouseEvent) => {
              ev.stopPropagation();

              onAddToList?.(product.id);
            }}
          >
            <ListPlus className="size-6" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
