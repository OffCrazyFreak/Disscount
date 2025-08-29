"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button-icon";
import { ListPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ProductItem {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  quantity: string;
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
    <Card className="px-6 py-4 hover:shadow-md hover:scale-101 transition-shadow transition-transform">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          {/* Product Image */}
          <div className="size-20 bg-gray-100 rounded-lg hidden sm:grid place-items-center">
            <span className="text-gray-400">IMG</span>
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
              className="font-bold"
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
            {product.quantity && (
              <>
                <div className="">{product.quantity}</div>
                <div className="hidden sm:block">~</div>
              </>
            )}
            <div className="font-bold text-lg">
              {product.averagePrice !== undefined
                ? `${product.averagePrice.toFixed(2)}€`
                : "N/A"}
            </div>
          </div>
          <Button
            variant="default"
            className="p-2 size-12"
            onClick={(ev: React.MouseEvent) => {
              ev.stopPropagation();

              onAddToList?.(product.id);
            }}
          >
            <ListPlus className="size-7" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
