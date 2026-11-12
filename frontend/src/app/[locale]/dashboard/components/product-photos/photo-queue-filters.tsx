import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { PhotoQueueFilter } from "@/lib/api/types";

const FILTERS: PhotoQueueFilter[] = ["todo", "pending", "reported"];

interface IPhotoQueueFiltersProps {
  filter: PhotoQueueFilter;
  reviewedCount: number;
  total: number;
  onChange: (filter: PhotoQueueFilter) => void;
}

export default function PhotoQueueFilters({
  filter,
  reviewedCount,
  total,
  onChange,
}: IPhotoQueueFiltersProps) {
  const t = useTranslations("productPhotos");

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label={t("queue.filterLabel")}
        className="flex flex-wrap gap-1.5"
      >
        {FILTERS.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === filter ? "primary" : "outline"}
            aria-pressed={option === filter}
            onClick={() => onChange(option)}
          >
            {t(`queue.filters.${option}`)}
          </Button>
        ))}
      </div>
      <p aria-live="polite" className="font-mono text-xs text-muted-foreground">
        {t("queue.total", { count: total })} ·{" "}
        {t("queue.reviewedCount", { count: reviewedCount })}
      </p>
    </div>
  );
}
