"use client";

import { useTranslations } from "next-intl";

import AddPhotoDialog from "@/components/custom/product-photos/add-photo-dialog";
import PhotoManager from "@/components/custom/product-photos/photo-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IProductPhotoDialogsProps {
  ean: string;
  productName: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isAdding: boolean;
  onAddingChange: (open: boolean) => void;
  isManaging: boolean;
  onManagingChange: (open: boolean) => void;
}

/** The upload and admin dialogs, opened from the photo tiles and from inside the viewer. */
export default function ProductPhotoDialogs({
  ean,
  productName,
  isAdmin,
  isLoggedIn,
  isAdding,
  onAddingChange,
  isManaging,
  onManagingChange,
}: IProductPhotoDialogsProps) {
  const t = useTranslations("productPhotos");

  return (
    <>
      {isLoggedIn && (
        <AddPhotoDialog
          ean={ean}
          productName={productName}
          open={isAdding}
          onOpenChange={onAddingChange}
          isAdmin={isAdmin}
        />
      )}

      {isAdmin && (
        <Dialog open={isManaging} onOpenChange={onManagingChange}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t("manager.title")}</DialogTitle>
              <DialogDescription className="sr-only">
                {productName}
              </DialogDescription>
            </DialogHeader>
            {isManaging && (
              <PhotoManager ean={ean} fallbackName={productName} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
