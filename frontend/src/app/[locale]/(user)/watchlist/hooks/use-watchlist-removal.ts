"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { watchlistService } from "@/lib/api";
import { WatchlistItemDto } from "@/lib/api/types";

export default function useWatchlistRemoval(
  watchlistItems: WatchlistItemDto[],
) {
  const t = useTranslations("watchlist");
  const queryClient = useQueryClient();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      const results = await Promise.allSettled(
        watchlistItems.map((watchlistItem) =>
          watchlistService.removeFromWatchlist(watchlistItem.id),
        ),
      );

      const failed = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failed === 0) {
        toast.success(t("removal.success"));
      } else if (failed === watchlistItems.length) {
        toast.error(t("removal.error"));
      } else {
        toast.error(t("removal.partial", { count: failed }));
      }
    } catch {
      toast.error(t("removal.error"));
    } finally {
      await queryClient.invalidateQueries({
        queryKey: watchlistService.QUERY_KEYS.all,
      });

      setIsRemoving(false);
    }
  }

  return { isRemoving, handleRemove };
}
