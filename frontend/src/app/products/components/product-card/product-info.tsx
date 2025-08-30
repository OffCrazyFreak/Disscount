import React from "react";
import { useRouter } from "next/navigation";

interface ProductInfoProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
  className?: string;
}

export function ProductInfo({ name, brand, category, className = "" }: ProductInfoProps) {
  const router = useRouter();

  return (
    <div className={className}>
      {category && (
        <div
          className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={(ev: React.MouseEvent) => {
            ev.stopPropagation();
            router.push(
              `/products?filterBy=category:${encodeURIComponent(category || "")}`
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
        {name || "Unknown Product"}
      </h3>

      {brand && (
        <div
          className="text-sm"
          onClick={(ev: React.MouseEvent) => {
            // Prevent the card click handler from firing
            ev.stopPropagation();
          }}
        >
          {brand}
        </div>
      )}
    </div>
  );
}
