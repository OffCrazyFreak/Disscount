"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

import {
  persistOptions,
  OFFLINE_CACHE_MAX_AGE_MS,
} from "@/lib/offline/persister";
import { registerOfflineMutationDefaults } from "@/lib/offline/offline-mutations";

interface IReactQueryProviderWrapperProps {
  children: ReactNode;
}

export default function ReactQueryProviderWrapper({
  children,
}: IReactQueryProviderWrapperProps) {
  // keep QueryClient stable across re-renders
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          // gcTime must be >= the persister's maxAge, otherwise entries are
          // evicted from memory before they can be restored from disk.
          gcTime: OFFLINE_CACHE_MAX_AGE_MS,
          // One retry after the initial fetch: a transient blip gets a second
          // chance, but a genuine failure surfaces fast instead of making the
          // user wait through the default 3-attempt backoff.
          retry: 1,
        },
      },
    });

    // Register replay functions so offline writes restored from disk can resume.
    registerOfflineMutationDefaults(client);

    return client;
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      // Once the cache is restored, replay any writes that were queued offline.
      onSuccess={() => {
        queryClient.resumePausedMutations();
      }}
    >
      {children}
      <ReactQueryDevtools />
    </PersistQueryClientProvider>
  );
}
