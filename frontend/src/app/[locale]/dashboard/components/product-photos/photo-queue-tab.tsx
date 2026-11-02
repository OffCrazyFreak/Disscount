"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import PhotoQueueFilters from "@/app/[locale]/dashboard/components/product-photos/photo-queue-filters";
import PhotoQueueList from "@/app/[locale]/dashboard/components/product-photos/photo-queue-list";
import PhotoQueuePager from "@/app/[locale]/dashboard/components/product-photos/photo-queue-pager";
import { useQueueSelection } from "@/app/[locale]/dashboard/components/product-photos/use-queue-selection";
import PhotoManager from "@/components/custom/product-photos/photo-manager";
import { QUEUE_PAGE_SIZE } from "@/lib/api/product-images/admin-queries";
import { usePhotoQueue } from "@/lib/api/product-images/admin-hooks";
import type { AdminPhotoQueuePage, PhotoQueueFilter } from "@/lib/api/types";

const EMPTY_PAGE: AdminPhotoQueuePage = {
  items: [],
  total: 0,
  page: 0,
  size: QUEUE_PAGE_SIZE,
  reviewedCount: 0,
};

export default function PhotoQueueTab() {
  const t = useTranslations("productPhotos");
  const [filter, setFilter] = useState<PhotoQueueFilter>("todo");
  const [page, setPage] = useState(0);
  const { data = EMPTY_PAGE } = usePhotoQueue(filter, page);
  const { selected, pick, clear, goNext } = useQueueSelection(data.items);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="space-y-3">
        <PhotoQueueFilters
          filter={filter}
          reviewedCount={data.reviewedCount}
          total={data.total}
          onChange={(next) => {
            setFilter(next);
            setPage(0);
            clear();
          }}
        />
        <PhotoQueueList
          items={data.items}
          page={page}
          pageSize={data.size}
          selectedEan={selected?.ean}
          onSelect={pick}
        />
        <PhotoQueuePager
          page={page}
          total={data.total}
          size={data.size}
          onPage={(next) => {
            setPage(next);
            clear();
          }}
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
