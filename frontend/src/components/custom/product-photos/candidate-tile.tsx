"use client";

import { useTranslations } from "next-intl";

import CandidateActions, {
  type ICandidateHandlers,
} from "@/components/custom/product-photos/candidate-actions";
import CandidateStamps from "@/components/custom/product-photos/candidate-stamps";
import PhotoTile from "@/components/custom/product-photos/photo-tile";
import { cn } from "@/lib/utils";
import type { AdminProductImage } from "@/lib/api/types";

interface ICandidateTileProps extends ICandidateHandlers {
  image: AdminProductImage;
  index: number;
  productName: string;
  busy: boolean;
}

export default function CandidateTile({
  image,
  index,
  productName,
  busy,
  ...handlers
}: ICandidateTileProps) {
  const t = useTranslations("productPhotos");
  const lang = image.lang ? ` ${image.lang.toUpperCase()}` : "";
  const source = t(`manager.source.${image.source}`) + lang;
  const status = t(`manager.status.${image.status}`);

  return (
    <li
      aria-label={t("manager.photoLabel", { index: index + 1, source, status })}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-2 transition-colors",
        image.main ? "border-primary bg-primary/5" : "border-border",
        image.status === "HIDDEN" && "opacity-60",
      )}
    >
      <PhotoTile
        // The 256 px small file is soft on a 245 px tile at 2x, so a copied photo shows its full file.
        src={image.fullUrl ?? image.previewUrl}
        alt={t("photo.altNumbered", { name: productName, index: index + 1 })}
        className={cn(image.main && "ring-2 ring-primary")}
      >
        <CandidateStamps image={image} source={source} status={status} />
      </PhotoTile>
      <CandidateActions image={image} busy={busy} {...handlers} />
    </li>
  );
}
