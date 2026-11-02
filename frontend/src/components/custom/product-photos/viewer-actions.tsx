"use client";

import { useState } from "react";
import { Flag, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLightboxState } from "yet-another-react-lightbox";

import { useSetMainPhoto } from "@/lib/api/product-images/admin-hooks";
import { useReportProductImage } from "@/lib/api/product-images/hooks";
import { problemMessage } from "@/lib/api/problem-details";
import type { ProductImage } from "@/lib/api/types";

interface IViewerActionsProps {
  ean: string;
  images: ProductImage[];
  canReport: boolean;
  isAdmin: boolean;
}

/** Toolbar buttons for the photo on screen; rendered inside the lightbox, which owns the index. */
export default function ViewerActions({
  ean,
  images,
  canReport,
  isAdmin,
}: IViewerActionsProps) {
  const t = useTranslations("productPhotos");
  const { currentIndex } = useLightboxState();
  const [reported, setReported] = useState<Set<string>>(() => new Set());
  const report = useReportProductImage();
  const setMain = useSetMainPhoto(ean);

  const image = images[currentIndex];
  if (!image) return null;

  const isMain = currentIndex === 0;
  const alreadyReported = reported.has(image.id);

  function handleReport() {
    report.mutate(image.id, {
      onSuccess: () => {
        setReported((previous) => new Set(previous).add(image.id));
        toast.success(t("viewer.reported"));
      },
      onError: (error) =>
        toast.error(problemMessage(error, t("viewer.reportFailed"))),
    });
  }

  function handleSetMain() {
    setMain.mutate(image.id, {
      onSuccess: () => toast.success(t("viewer.setMainDone")),
      onError: (error) =>
        toast.error(problemMessage(error, t("manager.actionFailed"))),
    });
  }

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {t("photo.thumbnail", {
          index: currentIndex + 1,
          total: images.length,
        })}
      </span>

      {isAdmin && (
        <button
          type="button"
          className="yarl__button"
          aria-label={isMain ? t("viewer.isMain") : t("viewer.setMain")}
          title={isMain ? t("viewer.isMain") : t("viewer.setMain")}
          aria-pressed={isMain}
          disabled={isMain || setMain.isPending}
          onClick={handleSetMain}
        >
          <Star
            aria-hidden="true"
            className="size-6"
            fill={isMain ? "currentColor" : "none"}
          />
        </button>
      )}

      {canReport && (
        <button
          type="button"
          className="yarl__button"
          aria-label={t("viewer.report")}
          title={t("viewer.report")}
          disabled={alreadyReported || report.isPending}
          onClick={handleReport}
        >
          <Flag aria-hidden="true" className="size-6" />
        </button>
      )}
    </>
  );
}
