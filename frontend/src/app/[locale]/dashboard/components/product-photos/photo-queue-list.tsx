import { useTranslations } from "next-intl";

import PhotoTile from "@/components/custom/product-photos/photo-tile";
import { cn } from "@/lib/utils";
import type { AdminPhotoQueueItem } from "@/lib/api/types";

interface IPhotoQueueListProps {
  items: AdminPhotoQueueItem[];
  page: number;
  pageSize: number;
  selectedEan?: string;
  onSelect: (ean: string) => void;
}

export default function PhotoQueueList({
  items,
  page,
  pageSize,
  selectedEan,
  onSelect,
}: IPhotoQueueListProps) {
  const t = useTranslations("productPhotos");

  return (
    <ol
      aria-label={t("queue.listLabel")}
      className="max-h-[70svh] space-y-1 overflow-y-auto pr-1"
    >
      {items.map((item, index) => {
        const selected = item.ean === selectedEan;
        return (
          <li key={item.ean}>
            <button
              type="button"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(item.ean)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-accent/60",
              )}
            >
              <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                {t("queue.rank", { rank: page * pageSize + index + 1 })}
              </span>
              <PhotoTile
                src={item.previewUrl}
                alt=""
                className="size-12 shrink-0 rounded-lg"
              >
                {!item.previewUrl && (
                  <span className="absolute inset-0 grid place-items-center text-[9px] text-neutral-400">
                    {t("queue.noPhoto")}
                  </span>
                )}
              </PhotoTile>
              <span className="min-w-0 flex-1">
                <span lang="hr" className="block truncate text-sm font-medium">
                  {item.name ?? item.ean}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                  {item.ean} ·{" "}
                  {t("manager.listings", { count: item.storeListings })}
                </span>
              </span>
              {(item.pendingCount > 0 || item.reportedCount > 0) && (
                <span className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[10px] font-semibold uppercase">
                  {item.pendingCount > 0 && (
                    <span className="rounded bg-amber-200 px-1 text-amber-900">
                      {item.pendingCount}
                    </span>
                  )}
                  {item.reportedCount > 0 && (
                    <span className="rounded bg-red-600 px-1 text-white">
                      {item.reportedCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
