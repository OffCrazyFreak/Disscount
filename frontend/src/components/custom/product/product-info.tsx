"use client";

import { memo } from "react";

interface IProductInfoProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
}

const ProductInfo = memo(function ProductInfo({
  name,
  brand,
  category,
}: IProductInfoProps) {
  return (
    <div className="min-w-0 flex-1">
      {category && (
        <div className="text-xs @md:text-sm text-gray-500">{category}</div>
      )}

      <h3 className="font-bold text-sm @md:text-base text-pretty">
        {name || "Nepoznat proizvod"}
      </h3>

      {brand && <div className="text-xs @md:text-sm">{brand}</div>}
    </div>
  );
});

export default ProductInfo;
