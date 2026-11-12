import { ImagePlus, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface IViewerFooterProps {
  onAdd: () => void;
  /** Set for admins only. */
  onManage?: () => void;
}

/** Sits above the viewer's thumbnail strip, which is 64 px tall with 16 px of padding on each side. */
export default function ViewerFooter({ onAdd, onManage }: IViewerFooterProps) {
  const t = useTranslations("productPhotos");

  return (
    <div className="absolute inset-x-0 bottom-28 z-10 flex flex-wrap justify-center gap-2 px-4">
      <Button
        variant="primary"
        size="sm"
        icon={ImagePlus}
        iconPlacement="left"
        onClick={onAdd}
      >
        {t("photo.add")}
      </Button>

      {onManage && (
        <Button
          variant="outline"
          size="sm"
          icon={SlidersHorizontal}
          iconPlacement="left"
          onClick={onManage}
        >
          {t("photo.manage")}
        </Button>
      )}
    </div>
  );
}
