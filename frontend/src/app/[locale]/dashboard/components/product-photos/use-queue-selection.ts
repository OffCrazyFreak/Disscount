import { useState } from "react";

import { useQueueKeys } from "@/app/[locale]/dashboard/components/product-photos/use-queue-keys";
import { useMarkProductReviewed } from "@/lib/api/product-images/admin-hooks";
import type { AdminPhotoQueueItem } from "@/lib/api/types";

export function useQueueSelection(items: AdminPhotoQueueItem[]) {
  const [picked, setPicked] = useState<string | null>(null);
  const found = items.findIndex((item) => item.ean === picked);
  const index = found < 0 ? 0 : found;
  const selected: AdminPhotoQueueItem | undefined = items[index];
  const reviewed = useMarkProductReviewed(selected?.ean ?? "");

  function select(next: number) {
    const item = items[Math.min(Math.max(next, 0), items.length - 1)];
    if (item) setPicked(item.ean);
  }

  // The reviewed row leaves the "to review" list on refetch, so remember who comes after it now.
  function goNext() {
    select(index + 1);
  }

  useQueueKeys({
    onNext: goNext,
    onPrevious: () => select(index - 1),
    onReviewed: () => {
      if (selected) reviewed.mutate(undefined, { onSuccess: goNext });
    },
  });

  return { selected, pick: setPicked, clear: () => setPicked(null), goNext };
}
