import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface IPhotoQueuePagerProps {
  page: number;
  total: number;
  size: number;
  onPage: (page: number) => void;
}

export default function PhotoQueuePager({
  page,
  total,
  size,
  onPage,
}: IPhotoQueuePagerProps) {
  const t = useTranslations("productPhotos");
  const pages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={t("queue.previousPage")}
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {t("queue.page", { page: page + 1, pages })}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={t("queue.nextPage")}
        disabled={page + 1 >= pages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
