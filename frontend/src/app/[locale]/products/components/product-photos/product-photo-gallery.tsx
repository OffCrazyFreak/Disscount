"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import PhotoTile from "@/components/custom/product-photos/photo-tile";
import ProductPhotoActions from "@/app/[locale]/products/components/product-photos/product-photo-actions";
import ProductPhotoEmpty from "@/app/[locale]/products/components/product-photos/product-photo-empty";
import ProductPhotoThumbs from "@/app/[locale]/products/components/product-photos/product-photo-thumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/user-context";
import { useProductImages } from "@/lib/api/product-images/hooks";
import { isAdmin } from "@/lib/api/schemas/auth-user";

// The viewer and its plugins only load once someone opens a photo.
const ProductPhotoViewer = dynamic(
  () => import("@/components/custom/product-photos/product-photo-viewer"),
  { ssr: false },
);

interface IProductPhotoGalleryProps {
  ean: string;
  productName: string;
}

export default function ProductPhotoGallery({
  ean,
  productName,
}: IProductPhotoGalleryProps) {
  const t = useTranslations("productPhotos");
  const { user } = useUser();
  const { data, isLoading } = useProductImages(ean);
  const [shown, setShown] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const admin = isAdmin(user?.accountType);
  const images = data?.images ?? [];
  const current = images[Math.min(shown, images.length - 1)];

  return (
    <section aria-label={t("manager.title")} className="space-y-3">
      {isLoading ? (
        <Skeleton className="aspect-square w-full rounded-xl" />
      ) : current ? (
        <button
          type="button"
          aria-label={t("photo.open", { name: productName })}
          onClick={() => setViewerOpen(true)}
          className="block w-full cursor-zoom-in rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <PhotoTile
            src={current.thumbUrl}
            alt={t("photo.alt", { name: productName })}
            loading="eager"
            className="shadow-sm"
          >
            {current.status === "PENDING" && (
              <span className="absolute bottom-2 left-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                {t("photo.unverified")}
              </span>
            )}
          </PhotoTile>
        </button>
      ) : (
        <ProductPhotoEmpty />
      )}

      {images.length > 1 && (
        <ProductPhotoThumbs
          images={images}
          shown={shown}
          productName={productName}
          onShow={setShown}
        />
      )}

      <ProductPhotoActions
        ean={ean}
        productName={productName}
        isAdmin={admin}
        isLoggedIn={Boolean(user)}
      />

      {viewerOpen && current && (
        <ProductPhotoViewer
          ean={ean}
          productName={productName}
          images={images}
          index={shown}
          onIndexChange={setShown}
          onClose={() => setViewerOpen(false)}
          canReport={Boolean(user)}
          isAdmin={admin}
        />
      )}
    </section>
  );
}
