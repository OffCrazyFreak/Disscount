"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";

import PhotoBand from "@/components/custom/product-photos/photo-band";
import PhotoTile from "@/components/custom/product-photos/photo-tile";
import ProductPhotoDialogs from "@/app/[locale]/products/components/product-photos/product-photo-dialogs";
import ProductPhotoStrip from "@/app/[locale]/products/components/product-photos/product-photo-strip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/user-context";
import { useProductImages } from "@/lib/api/product-images/hooks";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { cn } from "@/lib/utils";

// The viewer and its plugins only load once someone opens a photo.
const ProductPhotoViewer = dynamic(
  () => import("@/components/custom/product-photos/product-photo-viewer"),
  { ssr: false },
);

interface IProductPhotoGalleryProps {
  ean: string;
  productName: string;
  className?: string;
}

const TILE_FOCUS =
  "relative block size-full cursor-zoom-in rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

export default function ProductPhotoGallery({
  ean,
  productName,
  className,
}: IProductPhotoGalleryProps) {
  const t = useTranslations("productPhotos");
  const { user } = useUser();
  const { data, isLoading } = useProductImages(ean);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const admin = isAdmin(user?.accountType);
  const images = data?.images ?? [];
  const main = images[0];

  // Uploads need an account, so a signed-out visitor gets the shared sign-in modal first.
  function requestAdd() {
    setViewerIndex(null);
    if (user) setIsAdding(true);
    else openModalUrl({ name: "login" });
  }

  function requestManage() {
    setViewerIndex(null);
    setIsManaging(true);
  }

  return (
    // As tall as the rows the parent grid gives it; the main photo and strip squares follow that height.
    <section
      aria-label={t("manager.title")}
      className={cn("flex gap-2.5", className)}
    >
      <div className="aspect-square h-full shrink-0">
        {isLoading ? (
          <Skeleton className="size-full rounded-xl" />
        ) : main ? (
          <button
            type="button"
            aria-label={t("photo.open", { name: productName })}
            onClick={() => setViewerIndex(0)}
            className={TILE_FOCUS}
          >
            <PhotoTile
              src={main.smallUrl}
              alt={t("photo.alt", { name: productName })}
              loading="eager"
              className="size-full shadow-sm"
            >
              {main.status === "PENDING" && (
                <span className="absolute top-2 left-2 max-w-[calc(100%-2.5rem)] truncate rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                  {t("photo.unverified")}
                </span>
              )}
              {images.length > 1 && (
                // Wide screens show the other photos in the strip, so the count is for narrow ones.
                <Badge
                  size="count"
                  aria-hidden="true"
                  className="absolute top-2 right-2 md:hidden"
                >
                  +{images.length - 1}
                </Badge>
              )}
              <PhotoBand action="open" />
            </PhotoTile>
          </button>
        ) : (
          <button
            type="button"
            aria-label={t("photo.add")}
            onClick={requestAdd}
            className={cn(TILE_FOCUS, "cursor-pointer")}
          >
            <div className="relative flex size-full items-center justify-center overflow-hidden rounded-xl bg-muted">
              <Package
                aria-hidden="true"
                className="size-1/3 text-muted-foreground/60"
              />
              <PhotoBand action="add" />
            </div>
          </button>
        )}
      </div>

      <ProductPhotoStrip
        images={images}
        onOpen={setViewerIndex}
        onAdd={requestAdd}
        className="hidden md:grid"
      />

      <ProductPhotoDialogs
        ean={ean}
        productName={productName}
        isAdmin={admin}
        isLoggedIn={Boolean(user)}
        isAdding={isAdding}
        onAddingChange={setIsAdding}
        isManaging={isManaging}
        onManagingChange={setIsManaging}
      />

      {viewerIndex !== null && main && (
        <ProductPhotoViewer
          ean={ean}
          productName={productName}
          images={images}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onAdd={requestAdd}
          onManage={admin ? requestManage : undefined}
          canReport={Boolean(user)}
          isAdmin={admin}
        />
      )}
    </section>
  );
}
