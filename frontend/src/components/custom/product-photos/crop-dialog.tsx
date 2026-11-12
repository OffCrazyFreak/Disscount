"use client";

import { useState } from "react";
import { RotateCcw, RotateCw, Maximize } from "lucide-react";
import { useTranslations } from "next-intl";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "sonner";

import { useCropSource } from "@/components/custom/product-photos/use-crop-source";
import {
  toPercent,
  toPixels,
} from "@/components/custom/product-photos/crop-math";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCropPhoto } from "@/lib/api/product-images/admin-hooks";
import { problemMessage } from "@/lib/api/problem-details";
import type { AdminProductImage } from "@/lib/api/types";

interface ICropDialogProps {
  ean: string;
  image: AdminProductImage;
  onClose: () => void;
}

export default function CropDialog({ ean, image, onClose }: ICropDialogProps) {
  const t = useTranslations("productPhotos");
  const [rotation, setRotation] = useState(image.rotation);
  const [crop, setCrop] = useState<PercentCrop | undefined>(undefined);
  const source = useCropSource(image.originalUrl, rotation);
  const save = useCropPhoto(ean);

  // The saved crop belongs to the saved rotation; after turning, start from the whole photo.
  const shown =
    crop ??
    (source.status === "ready" && rotation === image.rotation && image.crop
      ? toPercent(image.crop, source.width, source.height)
      : undefined);

  function turn(by: number) {
    setRotation((current) => (current + by + 360) % 360);
    setCrop(undefined);
  }

  function handleSave() {
    if (source.status !== "ready") return;
    save.mutate(
      {
        imageId: image.id,
        rotation,
        crop: shown ? toPixels(shown, source.width, source.height) : null,
      },
      {
        onSuccess: () => {
          toast.success(t("crop.saved"));
          onClose();
        },
        onError: (error) =>
          toast.error(problemMessage(error, t("manager.actionFailed"))),
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("crop.title")}</DialogTitle>
          <DialogDescription>{t("crop.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-64 place-items-center rounded-lg bg-white p-2 [color-scheme:only_light] forced-color-adjust-none">
          {source.status === "ready" ? (
            <ReactCrop
              crop={shown}
              onChange={(_, percent) => setCrop(percent)}
              keepSelection
              ruleOfThirds
              // ReactCrop.css makes the image inherit max-height, so the limit has to sit on the root.
              className="max-h-[60svh]"
              ariaLabels={{
                cropArea: t("crop.handles.area"),
                nwDragHandle: t("crop.handles.nw"),
                nDragHandle: t("crop.handles.n"),
                neDragHandle: t("crop.handles.ne"),
                eDragHandle: t("crop.handles.e"),
                seDragHandle: t("crop.handles.se"),
                sDragHandle: t("crop.handles.s"),
                swDragHandle: t("crop.handles.sw"),
                wDragHandle: t("crop.handles.w"),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.url} alt={t("crop.handles.image")} />
            </ReactCrop>
          ) : (
            <p aria-live="polite" className="text-sm text-neutral-500">
              {source.status === "error"
                ? t("crop.loadFailed")
                : t("crop.loading")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            iconPlacement="left"
            onClick={() => turn(-90)}
          >
            {t("crop.rotateLeft")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            iconPlacement="left"
            onClick={() => turn(90)}
          >
            {t("crop.rotateRight")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Maximize}
            iconPlacement="left"
            onClick={() =>
              setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 })
            }
          >
            {t("crop.reset")}
          </Button>
        </div>

        <DialogFooter>
          <Button
            disabled={source.status !== "ready"}
            loading={save.isPending}
            loadingText={t("crop.saving")}
            onClick={handleSave}
          >
            {t("crop.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
