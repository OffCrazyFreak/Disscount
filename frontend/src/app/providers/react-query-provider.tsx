"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  persistOptions,
  OFFLINE_CACHE_MAX_AGE_MS,
} from "@/lib/offline/persister";
import { bindLastUsedQueryClient } from "@/lib/api/digital-cards/last-used";
import { replayCardPhotoOutbox } from "@/lib/offline/card-photo-outbox";
import { registerOfflineMutationDefaults } from "@/lib/offline/offline-mutations";

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
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          // Must be >= the persister's maxAge, or entries evict before restoring.
          gcTime: OFFLINE_CACHE_MAX_AGE_MS,
          // One retry: a blip gets a second chance, a real failure surfaces fast.
          retry: 1,
        },
      },
    });

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

    // Photos go after paused card saves, or an upload for a card the server has not
    // seen yet answers 404 and is dropped.
    function replayWrites() {
      void queryClient
        .resumePausedMutations()
        .then(() => replayCardPhotoOutbox(queryClient, tCards));
    }

    window.addEventListener("online", replayWrites);
    return () => window.removeEventListener("online", replayWrites);
  }, [queryClient, tCards]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      // Once the cache is restored, replay any writes that were queued offline.
      onSuccess={() => {
        void queryClient
          .resumePausedMutations()
          .then(() => replayCardPhotoOutbox(queryClient, tCards));
      }}
    >
      {children}

      {/* Its floating button sits over the mobile bottom nav, so it is opt-in
          via NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS=true, like react-scan. */}
      {process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS === "true" && (
        <ReactQueryDevtools />
      )}
    </PersistQueryClientProvider>
  );
}
