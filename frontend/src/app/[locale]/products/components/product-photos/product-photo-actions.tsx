"use client";

import { useState } from "react";
import { ImagePlus, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import AddPhotoDialog from "@/components/custom/product-photos/add-photo-dialog";
import PhotoManager from "@/components/custom/product-photos/photo-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { openModalUrl } from "@/lib/modal/modal-navigation";

interface IProductPhotoActionsProps {
  ean: string;
  productName: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

export default function ProductPhotoActions({
  ean,
  productName,
  isAdmin,
  isLoggedIn,
}: IProductPhotoActionsProps) {
  const t = useTranslations("productPhotos");
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        icon={ImagePlus}
        iconPlacement="left"
        // Uploads need an account, so a signed-out visitor gets the shared sign-in modal first.
        onClick={() =>
          isLoggedIn ? setAdding(true) : openModalUrl({ name: "login" })
        }
      >
        {t("photo.add")}
      </Button>

      {isAdmin && (
        <Button
          variant="secondary"
          size="sm"
          icon={SlidersHorizontal}
          iconPlacement="left"
          onClick={() => setManaging(true)}
        >
          {t("photo.manage")}
        </Button>
      )}

      {isLoggedIn && (
        <AddPhotoDialog
          ean={ean}
          productName={productName}
          open={adding}
          onOpenChange={setAdding}
          isAdmin={isAdmin}
        />
      )}

      {isAdmin && (
        <Dialog open={managing} onOpenChange={setManaging}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t("manager.title")}</DialogTitle>
              <DialogDescription className="sr-only">
                {productName}
              </DialogDescription>
            </DialogHeader>
            {managing && <PhotoManager ean={ean} fallbackName={productName} />}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
