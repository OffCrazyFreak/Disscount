import type { MutationKey, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CardToastTranslator } from "@/lib/offline/card-write-failed";
import type { OfflineToastTranslator } from "@/lib/offline/list-write-failed";
import {
  DIGITAL_CARD_MUTATION_SCOPE,
  isOfflineMutationKey,
  OFFLINE_MUTATION_KEYS,
} from "@/lib/offline/offline-mutation-keys";
import { isQueuedWriteExpired } from "@/lib/offline/queued-write-expiry";

/** One toast per message; no refetch, because data that old is already stale and refetches as soon as it is shown online. */
export function dropExpiredWrites(
  queryClient: QueryClient,
  t: OfflineToastTranslator,
  tCards: CardToastTranslator,
) {
  const mutationCache = queryClient.getMutationCache();
  const expired = mutationCache
    .getAll()
    .filter(
      (mutation) =>
        mutation.state.isPaused &&
        isOfflineMutationKey(mutation.options.mutationKey) &&
        isQueuedWriteExpired(mutation.state.submittedAt),
    );

  for (const mutation of expired) mutationCache.remove(mutation);

  const messages = new Set(
    expired.map((mutation) => {
      if (mutation.options.scope?.id !== DIGITAL_CARD_MUTATION_SCOPE.id) {
        return t("offline.writeFailed");
      }
      return isSameKey(
        mutation.options.mutationKey,
        OFFLINE_MUTATION_KEYS.digitalCardDelete,
      )
        ? tCards("offline.cardDeleteFailed")
        : tCards("offline.cardSaveFailed");
    }),
  );
  for (const message of messages) toast.error(message);
}

function isSameKey(key: MutationKey | undefined, other: MutationKey) {
  return JSON.stringify(key) === JSON.stringify(other);
}
