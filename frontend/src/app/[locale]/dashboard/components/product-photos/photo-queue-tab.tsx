"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import PhotoQueueFilters from "@/app/[locale]/dashboard/components/product-photos/photo-queue-filters";
import PhotoQueueList from "@/app/[locale]/dashboard/components/product-photos/photo-queue-list";
import { useQueueSelection } from "@/app/[locale]/dashboard/components/product-photos/use-queue-selection";
import PhotoManager from "@/components/custom/product-photos/photo-manager";
import { usePhotoQueue } from "@/lib/api/product-images/admin-hooks";
import type { PhotoQueueFilter } from "@/lib/api/types";

const EMPTY_QUEUE = { items: [], totalItems: 0, reviewedCount: 0 };

export default function PhotoQueueTab() {
  const t = useTranslations("productPhotos");
  const [filter, setFilter] = useState<PhotoQueueFilter>("todo");
  const {
    data = EMPTY_QUEUE,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePhotoQueue(filter);
  const { selected, pick, clear, goNext } = useQueueSelection(data.items);

  // A scroll during the refetch a review starts must not cut that refetch short.
  const loadNextPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="space-y-3">
        <PhotoQueueFilters
          filter={filter}
          reviewedCount={data.reviewedCount}
          total={data.totalItems}
          onChange={(next) => {
            setFilter(next);
            clear();
          }}
        />
        <PhotoQueueList
          items={data.items}
          selectedEan={selected?.ean}
          onSelect={pick}
          canLoadMore={hasNextPage && !isFetchingNextPage}
          isLoadingMore={isFetchingNextPage}
          onNearEnd={loadNextPage}
        />
        <p className="text-xs text-muted-foreground">
          {t("queue.keyboardHint")}
        </p>
      </div>

      <div className="min-w-0">
        {selected ? (
          <PhotoManager
            key={selected.ean}
            ean={selected.ean}
            fallbackName={selected.name ?? selected.ean}
            onReviewed={goNext}
          />
        ) : (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {t("queue.empty")}
          </p>
        )}
      </div>
    </div>
  );
}
