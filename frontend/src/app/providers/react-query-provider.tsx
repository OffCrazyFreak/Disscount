"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

import {
  persistOptions,
  OFFLINE_CACHE_MAX_AGE_MS,
} from "@/lib/offline/persister";

export function ReactQueryProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // keep QueryClient stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // gcTime must be >= the persister's maxAge, otherwise entries are
            // evicted from memory before they can be restored from disk.
            gcTime: OFFLINE_CACHE_MAX_AGE_MS,
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
      <ReactQueryDevtools />
    </PersistQueryClientProvider>
  );
}
