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
  /** Opens the upload; the caller closes the viewer first so the dialog is not stacked under it. List rows leave it out. */
  onAdd?: () => void;
  /** Set for admins only. */
  onManage?: () => void;
  canReport: boolean;
  isAdmin: boolean;
}

// Rendered squares are at most this size; a smaller source simply stays smaller.
const FULL_SIDE = 1080;
const THUMB_SIDE = 400;

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
    width: FULL_SIDE,
    height: FULL_SIDE,
    srcSet: [
      { src: image.thumbUrl, width: THUMB_SIDE, height: THUMB_SIDE },
      { src: image.fullUrl, width: FULL_SIDE, height: FULL_SIDE },
    ],
  }));

  return (
    <Lightbox
      open
      close={requestClose}
      index={index}
      slides={slides}
      plugins={[Zoom, Thumbnails, Counter]}
      on={{ view: ({ index: viewed }) => onIndexChange(viewed) }}
      carousel={{ finite: true, padding: "16px" }}
      controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
      zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
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
          onAdd ? <ViewerFooter onAdd={onAdd} onManage={onManage} /> : null,
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
