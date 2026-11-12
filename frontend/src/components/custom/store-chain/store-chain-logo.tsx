"use client";

import { useState } from "react";
import Image from "next/image";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { getChainLabel } from "@/utils/labels";

interface IStoreChainLogoProps {
  chain: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
}

/** Falls back to a placeholder so an unmapped chain from the cijene API never renders a broken image. */
export default function StoreChainLogo({
  chain,
  className,
  width = 256,
  height = 256,
  fill = false,
  sizes,
}: IStoreChainLogoProps) {
  const [hasError, setHasError] = useState(false);

  const label = getChainLabel(chain);

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
