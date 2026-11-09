"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { useUser } from "@/context/user-context";
import { useProductImages } from "@/lib/api/product-images/hooks";
import { isAdmin } from "@/lib/api/schemas/auth-user";

const ProductPhotoViewer = dynamic(
  () => import("@/components/custom/product-photos/product-photo-viewer"),
  { ssr: false },
);

interface IProductThumbnailViewerProps {
  ean: string;
  productName: string;
  onClose: () => void;
}

export default function ProductThumbnailViewer({
  ean,
  productName,
  onClose,
}: IProductThumbnailViewerProps) {
  const { user } = useUser();
  const [index, setIndex] = useState(0);
  const { data } = useProductImages(ean);
  const images = data?.images ?? [];

  if (images.length === 0) return null;

  return (
    <ProductPhotoViewer
      ean={ean}
      productName={productName}
      images={images}
      index={index}
      onIndexChange={setIndex}
      onClose={onClose}
      canReport={Boolean(user)}
      isAdmin={isAdmin(user?.accountType)}
    />
  );
}
