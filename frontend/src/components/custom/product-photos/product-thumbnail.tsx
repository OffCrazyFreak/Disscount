"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";

import PhotoBand from "@/components/custom/product-photos/photo-band";
import PhotoTile from "@/components/custom/product-photos/photo-tile";
import ProductThumbnailViewer from "@/components/custom/product-photos/product-thumbnail-viewer";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useProductThumbnail } from "@/lib/api/product-images/hooks";
import { cn } from "@/lib/utils";

interface IProductThumbnailProps {
  /** A row without a barcode, such as a typed shopping list item, shows the placeholder. */
  ean: string | null | undefined;
  /** Set on product rows: the photo becomes its own button that opens the viewer in place. */
  productName?: string;
  className?: string;
}

/**
 * The fixed square a product row keeps for its photo, so nothing shifts when the photo
 * arrives. Decorative unless it opens the viewer: every row that shows one names the product right beside it.
 */
export default function ProductThumbnail({
  ean,
  productName,
  className,
}: IProductThumbnailProps) {
  const t = useTranslations("productPhotos");
  const [isViewing, setIsViewing] = useState(false);
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

  if (url && !hasFailed && ean && productName) {
    return (
      <>
        <button
          type="button"
          aria-label={t("photo.open", { name: productName })}
          // Raised above the row's stretched link, and kept from also opening the product.
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsViewing(true);
          }}
          className={cn(
            "relative z-10 shrink-0 cursor-zoom-in rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
            className,
          )}
        >
          <PhotoTile
            src={url}
            alt=""
            onError={() => setFailure({ url, isOnline })}
            className="size-full rounded-xl"
          >
            <PhotoBand action="open" className="[&_svg]:size-3" />
          </PhotoTile>
        </button>
        {isViewing && (
          <ProductThumbnailViewer
            ean={ean}
            productName={productName}
            onClose={() => setIsViewing(false)}
          />
        )}
      </>
    );
  }

  if (url && !hasFailed) {
    return (
      <PhotoTile
        src={url}
        alt=""
        onError={() => setFailure({ url, isOnline })}
        className={cn("shrink-0 rounded-xl", className)}
      />
    );
  }

  return (
    <div
      data-slot="product-thumbnail-placeholder"
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center rounded-xl bg-muted",
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
