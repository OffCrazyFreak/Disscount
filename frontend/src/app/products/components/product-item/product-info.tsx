"use client";

import { memo } from "react";

interface IProductInfoProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
}

export const ProductInfo = memo(function ProductInfo({
  name,
  brand,
  category,
}: IProductInfoProps) {
  return (
    <div className="flex-1">
      {category && (
        <div
          className="text-xs sm:text-sm text-gray-500"
        >
          {category}
        </div>
      )}

      <h3
        className="font-bold text-sm sm:text-md"
      >
        {name || "Unknown product name"}
      </h3>

      {brand && (
        <div
          className="text-xs sm:text-sm"
        >
          {brand}
        </div>
      )}
    </div>
  );
});
