"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import AddPhotoDialog from "@/components/custom/product-photos/add-photo-dialog";
import CandidateTile from "@/components/custom/product-photos/candidate-tile";
import CropDialog from "@/components/custom/product-photos/crop-dialog";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import PhotoManagerHeader from "@/components/custom/product-photos/photo-manager-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminProductPhotos,
  useDeletePhoto,
  useSetMainPhoto,
  useSetPhotoStatus,
} from "@/lib/api/product-images/admin-hooks";
import { problemMessage } from "@/lib/api/problem-details";
import type { AdminProductImage } from "@/lib/api/types";

interface IPhotoManagerProps {
  ean: string;
  fallbackName: string;
  /** Called after "mark as reviewed", so the queue can move on. */
  onReviewed?: () => void;
}

export default function PhotoManager({
  ean,
  fallbackName,
  onReviewed,
}: IPhotoManagerProps) {
  const t = useTranslations("productPhotos");
  const { data, isLoading } = useAdminProductPhotos(ean);
  const setMain = useSetMainPhoto(ean);
  const setStatus = useSetPhotoStatus(ean);
  const deletePhoto = useDeletePhoto(ean);
  const [deleting, setDeleting] = useState<AdminProductImage | null>(null);
  const [cropping, setCropping] = useState<AdminProductImage | null>(null);
  const [adding, setAdding] = useState(false);

  const name = data?.name ?? fallbackName;
  const busy =
    setMain.isPending || setStatus.isPending || deletePhoto.isPending;
  const onError = (error: Error) =>
    toast.error(problemMessage(error, t("manager.actionFailed")));

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    // Columns follow the manager's own width, because on the dashboard it sits in a narrow pane.
    <div className="@container space-y-4">
      <PhotoManagerHeader
        product={data}
        name={name}
        onAdd={() => setAdding(true)}
        onReviewed={onReviewed}
      />

      {data.images.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("manager.empty")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @4xl:grid-cols-4">
          {data.images.map((image, index) => (
            <CandidateTile
              key={image.id}
              image={image}
              index={index}
              productName={name}
              busy={busy}
              onSetMain={() => setMain.mutate(image.id, { onError })}
              onCrop={() => setCropping(image)}
              onDelete={() => setDeleting(image)}
              onApprove={() =>
                setStatus.mutate(
                  { imageId: image.id, status: "VERIFIED" },
                  { onError },
                )
              }
              onToggleHidden={() =>
                setStatus.mutate(
                  {
                    imageId: image.id,
                    status: image.status === "HIDDEN" ? "VERIFIED" : "HIDDEN",
                  },
                  { onError },
                )
              }
            />
          ))}
        </ul>
      )}

      {cropping && (
        <CropDialog
          ean={ean}
          image={cropping}
          onClose={() => setCropping(null)}
        />
      )}
      <ConfirmDialog
        isOpen={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("manager.deleteTitle")}
        description={t("manager.deleteDescription")}
        confirmLabel={t("manager.deleteConfirm")}
        cancelLabel={t("manager.deleteCancel")}
        variant="destructive"
        isLoading={deletePhoto.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deletePhoto.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t("manager.deleted"));
              setDeleting(null);
            },
            onError,
          });
        }}
      />
      <AddPhotoDialog
        ean={ean}
        productName={name}
        open={adding}
        onOpenChange={setAdding}
        isAdmin
      />
    </div>
  );
}
