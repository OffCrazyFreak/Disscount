"use client";

import { useState } from "react";
import { Package } from "lucide-react";

import PhotoTile from "@/components/custom/product-photos/photo-tile";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useProductThumbnail } from "@/lib/api/product-images/hooks";
import { cn } from "@/lib/utils";

interface IProductThumbnailProps {
  /** A row without a barcode, such as a typed shopping list item, shows the placeholder. */
  ean: string | null | undefined;
  className?: string;
}

/**
 * The fixed square a product row keeps for its photo, so nothing shifts when the photo
 * arrives. Always decorative: every row that shows one names the product right beside it.
 */
export default function ProductThumbnail({
  ean,
  className,
}: IProductThumbnailProps) {
  const { data: url, isLoading } = useProductThumbnail(ean ?? undefined);
  const isOnline = useOnlineStatus();
  // Offline or a vanished file: the placeholder instead of a broken image icon. A change in
  // connection tries the file again, so a photo lost to a dropped signal comes back.
  const [failure, setFailure] = useState<{
    url: string;
    isOnline: boolean;
  } | null>(null);
  const hasFailed =
    failure !== null && failure.url === url && failure.isOnline === isOnline;

  if (url && !hasFailed) {
    return (
      <PhotoTile
        src={url}
        alt=""
        onError={() => setFailure({ url, isOnline })}
        className={cn("shrink-0 rounded-lg", className)}
      />
    );
  }

  return (
    <div
      data-slot="product-thumbnail-placeholder"
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center rounded-lg bg-muted",
        className,
      )}
    >
      {/* Left empty while asking, so a row that has a photo never flashes the icon first. */}
      {!isLoading && (
        <Package
          aria-hidden="true"
          className="size-1/2 text-muted-foreground/60"
        />
      )}
    </div>
  );
}
