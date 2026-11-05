"use client";

import { useTranslations } from "next-intl";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import ViewerActions from "@/components/custom/product-photos/viewer-actions";
import ViewerFooter from "@/components/custom/product-photos/viewer-footer";
import { useBackCloses } from "@/components/custom/product-photos/use-back-closes";
import type { ProductImage } from "@/lib/api/types";

interface IProductPhotoViewerProps {
  ean: string;
  productName: string;
  images: ProductImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** The caller closes the viewer first, so the upload dialog is not stacked under it. */
  onAdd?: () => void;
  /** Set for admins only. */
  onManage?: () => void;
  canReport: boolean;
  isAdmin: boolean;
}

// A photo rendered before the full file kept its shape is a square of at most this size.
const OLDER_FULL_SIDE = 1080;

export default function ProductPhotoViewer({
  ean,
  productName,
  images,
  index,
  onIndexChange,
  onClose,
  onAdd,
  onManage,
  canReport,
  isAdmin,
}: IProductPhotoViewerProps) {
  const t = useTranslations("productPhotos");
  const requestClose = useBackCloses(true, onClose);

  const slides = images.map((image, i) => ({
    src: image.fullUrl,
    alt: t("photo.altNumbered", { name: productName, index: i + 1 }),
    width: image.fullWidth ?? OLDER_FULL_SIDE,
    height: image.fullHeight ?? OLDER_FULL_SIDE,
    thumbnail: image.smallUrl,
  }));

  return (
    <Lightbox
      open
      close={() => requestClose()}
      index={index}
      slides={slides}
      plugins={[Zoom, Thumbnails, Counter]}
      on={{ view: ({ index: viewed }) => onIndexChange(viewed) }}
      carousel={{ finite: true, padding: "16px" }}
      controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
      // The default limit is one CSS pixel per file pixel, which stays sharp at 2x.
      zoom={{ scrollToZoom: true }}
      thumbnails={{
        width: 64,
        height: 64,
        border: 0,
        borderRadius: 8,
        padding: 0,
        gap: 8,
      }}
      render={{
        // One photo needs neither arrows nor a strip of one thumbnail.
        buttonPrev: images.length > 1 ? undefined : () => null,
        buttonNext: images.length > 1 ? undefined : () => null,
        controls: () =>
          onAdd ? (
            <ViewerFooter
              onAdd={() => requestClose(onAdd)}
              onManage={onManage && (() => requestClose(onManage))}
            />
          ) : null,
      }}
      toolbar={{
        buttons: [
          <ViewerActions
            key="actions"
            ean={ean}
            images={images}
            canReport={canReport}
            isAdmin={isAdmin}
          />,
          "close",
        ],
      }}
      labels={{
        Previous: t("viewer.previous"),
        Next: t("viewer.next"),
        Close: t("viewer.close"),
        "Zoom in": t("viewer.zoomIn"),
        "Zoom out": t("viewer.zoomOut"),
        Lightbox: t("viewer.lightbox"),
        Carousel: t("viewer.carousel"),
        Slide: t("viewer.slide"),
        Thumbnails: t("viewer.thumbnails"),
        "Photo gallery": t("viewer.gallery"),
        // The lightbox fills in the numbers itself, so the placeholders pass through untouched.
        "{index} of {total}": t("viewer.slideOf", {
          index: "{index}",
          total: "{total}",
        }),
      }}
      styles={{
        container: { backgroundColor: "rgba(10, 12, 10, 0.96)" },
        thumbnail: { background: "#fff" },
      }}
    />
  );
}
