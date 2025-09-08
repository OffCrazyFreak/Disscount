import { memo, MouseEvent } from "react";
import { useRouter } from "next/navigation";

interface ProductInfoProps {
  name: string | null;
  brand?: string | null;
  category: string | null;
}

export const ProductInfo = memo(function ProductInfo({
  name,
  brand,
  category,
}: ProductInfoProps) {
  const router = useRouter();

  return (
    <div className="flex-1">
      {category && (
        <div
          className="text-xs sm:text-sm text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();

            router.push(`/products?category=${encodeURIComponent(category)}`);
          }}
        >
          {category}
        </div>
      )}

      <h3
        className="font-bold text-sm sm:text-md"
        onClick={(ev: MouseEvent) => {
          // Prevent the card click handler from firing
          ev.stopPropagation();
        }}
      >
        {name || "Unknown product name"}
      </h3>

      {brand && (
        <div
          className="text-xs sm:text-sm"
          onClick={(ev: MouseEvent) => {
            // Prevent the card click handler from firing
            ev.stopPropagation();
          }}
        >
          {brand}
        </div>
      )}
    </div>
  );
});
