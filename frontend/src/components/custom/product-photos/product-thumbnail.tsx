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

function stopEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

interface IProductThumbnailProps {
  /** A row without a barcode, such as a typed shopping list item, shows the placeholder. */
  ean: string | null | undefined;
  /** Set on product rows: the photo becomes its own button that opens the viewer in place. */
  productName?: string;
  className?: string;
}

/** A fixed square so nothing shifts; decorative unless it opens the viewer, as rows name the product. */
export default function ProductThumbnail({
  ean,
  productName,
  className,
}: IProductThumbnailProps) {
  const t = useTranslations("productPhotos");
  // Bumped on every tap, so a viewer whose photo request failed is mounted again and asks again.
  const [viewing, setViewing] = useState<number | null>(null);
  const { data: url, isLoading } = useProductThumbnail(ean ?? undefined);
  const isOnline = useOnlineStatus();
  // A change in connection tries the file again, so a photo lost to a dropped signal comes back.
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
            setViewing((count) => (count ?? 0) + 1);
          }}
          // The row owns a hold gesture; a press here must not also start it.
          onPointerDown={stopEvent}
          onPointerUp={stopEvent}
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
        {viewing !== null && (
          // React bubbles events out of the viewer's portal to the row, which would read them as a hold or a tap.
          <span
            className="contents"
            onClick={stopEvent}
            onPointerDown={stopEvent}
            onPointerUp={stopEvent}
          >
            <ProductThumbnailViewer
              key={viewing}
              ean={ean}
              productName={productName}
              onClose={() => setViewing(null)}
            />
          </span>
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
