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
import { CACHE_TIMES } from "@/lib/query/cache-times";

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
          // Must be >= the persister's maxAge, or entries evict before restoring.
          gcTime: OFFLINE_CACHE_MAX_AGE_MS,
          // Without this every backend query refetches on each mount, so moving
          // between pages refetches a list the user just looked at. The longer
          // per-query windows in lib/api and lib/cijene-api still win.
          staleTime: CACHE_TIMES.default,
          // One retry: a blip gets a second chance, a real failure surfaces fast.
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

      {/* Its floating button sits over the mobile bottom nav, so it is opt-in
          via NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS=true, like react-scan. */}
      {process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS === "true" && (
        <ReactQueryDevtools />
      )}
    </PersistQueryClientProvider>
  );
}
