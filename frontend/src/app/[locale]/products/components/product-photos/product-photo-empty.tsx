import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";

import PhotoTile from "@/components/custom/product-photos/photo-tile";

export default function ProductPhotoEmpty() {
  const t = useTranslations("productPhotos");

  return (
    <PhotoTile
      alt=""
      className="border border-dashed border-neutral-300 ring-0"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
        <Camera aria-hidden="true" className="size-10 text-neutral-400" />
        <p className="font-semibold text-neutral-800">{t("photo.none")}</p>
        <p className="text-sm text-pretty text-neutral-500">
          {t("photo.noneHint")}
        </p>
      </div>
    </PhotoTile>
  );
}
