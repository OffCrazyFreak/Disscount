"use client";

import { useRef, type ChangeEvent } from "react";
import { Camera, ImageUp, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import PhotoTile from "@/components/custom/product-photos/photo-tile";
import { usePreparedPhoto } from "@/components/custom/product-photos/use-prepared-photo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadProductImage } from "@/lib/api/product-images/hooks";
import { problemMessage } from "@/lib/api/problem-details";

interface IAddPhotoDialogProps {
  ean: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}

export default function AddPhotoDialog({
  ean,
  productName,
  open,
  onOpenChange,
  isAdmin,
}: IAddPhotoDialogProps) {
  const t = useTranslations("productPhotos");
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const { state, pick, reset } = usePreparedPhoto();
  const upload = useUploadProductImage(ean);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires a change.
    event.target.value = "";
    if (file) void pick(file);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSubmit() {
    if (state.status !== "ready") return;
    upload.mutate(state.blob, {
      onSuccess: () => {
        toast.success(t("upload.done"));
        handleOpenChange(false);
      },
      onError: (error) =>
        toast.error(problemMessage(error, t("upload.failed"))),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("upload.title")}</DialogTitle>
          <DialogDescription>{t("upload.description")}</DialogDescription>
        </DialogHeader>

        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFile}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFile}
        />

        <PhotoTile
          src={state.status === "ready" ? state.previewUrl : null}
          alt={t("upload.previewAlt")}
          className="mx-auto w-full max-w-64"
        >
          {state.status !== "ready" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-neutral-500">
              <span aria-live="polite">
                {state.status === "preparing"
                  ? t("upload.preparing")
                  : state.status === "error"
                    ? t(`upload.errors.${state.code}`)
                    : productName}
              </span>
            </div>
          )}
        </PhotoTile>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            icon={Camera}
            iconPlacement="left"
            onClick={() => cameraInput.current?.click()}
          >
            {t("upload.takePhoto")}
          </Button>
          <Button
            variant="outline"
            icon={ImageUp}
            iconPlacement="left"
            onClick={() => galleryInput.current?.click()}
          >
            {state.status === "ready"
              ? t("upload.change")
              : t("upload.chooseFile")}
          </Button>
        </div>

        <p className="text-xs text-pretty text-muted-foreground">
          {isAdmin ? t("upload.adminNote") : t("upload.public")}
        </p>

        <DialogFooter>
          <Button
            icon={Send}
            iconPlacement="left"
            disabled={state.status !== "ready"}
            loading={upload.isPending}
            loadingText={t("upload.submitting")}
            onClick={handleSubmit}
          >
            {t("upload.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
