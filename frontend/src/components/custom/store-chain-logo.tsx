"use client";

import { useState } from "react";
import Image from "next/image";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { storeNamesMap } from "@/constants/name-mappings";

interface StoreChainLogoProps {
  chain: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
}

/**
 * Renders a store chain logo from /store-chains/<chain>.png.
 * Falls back to a generic placeholder icon when the image is missing, so an
 * unmapped chain returned by the cijene API never renders a broken image.
 */
export default function StoreChainLogo({
  chain,
  className,
  width = 256,
  height = 256,
  fill = false,
  sizes,
}: StoreChainLogoProps) {
  const [hasError, setHasError] = useState(false);

  const label = storeNamesMap[chain] || chain;

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={label}
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400",
          fill ? "absolute inset-0" : "w-full h-full",
          className,
        )}
      >
        <Store className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <Image
      src={`/store-chains/${chain}.png`}
      alt={label}
      onError={() => setHasError(true)}
      className={cn(!fill && "w-full h-full", className)}
      {...(fill ? { fill, sizes } : { width, height })}
    />
  );
}
