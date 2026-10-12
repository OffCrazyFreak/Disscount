"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { watchlistService } from "@/lib/api";
import { WatchlistItemDto } from "@/lib/api/types";

export default function useWatchlistRemoval(
  watchlistItems: WatchlistItemDto[],
) {
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
        toast.success("Proizvod uklonjen s popisa za praćenje");
      } else if (failed === watchlistItems.length) {
        toast.error("Greška pri uklanjanju proizvoda");
      } else {
        toast.error(
          `Djelomično uklanjanje: ${failed} stavki nije moguće ukloniti.`,
        );
      }
    } catch {
      toast.error("Greška pri uklanjanju proizvoda");
    } finally {
      await queryClient.invalidateQueries({
        queryKey: watchlistService.QUERY_KEYS.all,
      });

      setIsRemoving(false);
    }
  }

  return { isRemoving, handleRemove };
}
