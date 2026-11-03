"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { persistOptions } from "@/lib/offline/persister";
import { createQueryClientConfig } from "@/lib/api/query-client-defaults";
import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import { bindLastUsedQueryClient } from "@/lib/api/digital-cards/last-used";
import {
  replayCardPhotoOutbox,
  type PhotoToastTranslator,
} from "@/lib/offline/card-photo-outbox";
import type { CardToastTranslator } from "@/lib/offline/card-write-failed";
import { dropExpiredWrites } from "@/lib/offline/drop-expired-writes";
import type { OfflineToastTranslator } from "@/lib/offline/list-write-failed";
import { registerOfflineMutationDefaults } from "@/lib/offline/offline-mutations";
import { clientEnv } from "@/lib/env";

// Photos go after paused card saves, or an upload for a card the server has not seen yet
// answers 404 and is dropped.
function replayQueuedWrites(
  queryClient: QueryClient,
  t: OfflineToastTranslator,
  tCards: CardToastTranslator & PhotoToastTranslator,
) {
  dropExpiredWrites(queryClient, t, tCards);
  void queryClient
    .resumePausedMutations()
    .then(() => replayCardPhotoOutbox(queryClient, tCards));
}

interface IReactQueryProviderWrapperProps {
  children: ReactNode;
}

export default function ReactQueryProviderWrapper({
  children,
}: IReactQueryProviderWrapperProps) {
  const t = useTranslations("ui");
  const tCards = useTranslations("digitalCards");

  // keep QueryClient stable across re-renders
  const [queryClient] = useState(() => {
    const client = new QueryClient(createQueryClientConfig());
    // Cards never leave memory, and so the snapshot, however long the app stays open
    // without the wallet being visited. Applies to restored entries too.
    client.setQueryDefaults(DIGITAL_CARD_QUERY_KEYS.all, { gcTime: Infinity });

    // Register replay functions so offline writes restored from disk can resume.
    registerOfflineMutationDefaults(client, t, tCards);

    return client;
  });

  // A language switch keeps this provider mounted, so re-register the defaults to
  // give replay toasts the new language.
  useEffect(() => {
    registerOfflineMutationDefaults(queryClient, t, tCards);
  }, [queryClient, t, tCards]);

  useEffect(() => {
    bindLastUsedQueryClient(queryClient);

    function replayWrites() {
      replayQueuedWrites(queryClient, t, tCards);
    }

    window.addEventListener("online", replayWrites);
    return () => window.removeEventListener("online", replayWrites);
  }, [queryClient, t, tCards]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      // Once the cache is restored, replay any writes that were queued offline.
      onSuccess={() => replayQueuedWrites(queryClient, t, tCards)}
    >
      {children}

      {/* Its floating button sits over the mobile bottom nav, so it is opt-in
          via NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS=true, like react-scan. */}
      {clientEnv.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS && (
        <ReactQueryDevtools />
      )}
    </PersistQueryClientProvider>
  );
}
