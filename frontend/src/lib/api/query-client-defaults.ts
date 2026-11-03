import * as Sentry from "@sentry/nextjs";
import {
  isCancelledError,
  MutationCache,
  onlineManager,
  QueryCache,
  type QueryClientConfig,
  type QueryKey,
} from "@tanstack/react-query";
import { isCancel } from "axios";
import { ZodError } from "zod";

import { httpStatus } from "@/lib/offline/failure-policy";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";
import { OFFLINE_CACHE_MAX_AGE_MS } from "@/lib/offline/persister";

// One retry: a blip gets a second chance, a real failure surfaces fast.
const MAX_QUERY_RETRIES = 1;

// Client errors a second attempt can fix: the request timed out, or we were throttled.
const RETRYABLE_CLIENT_STATUSES = new Set([408, 429]);

// Long enough that a restored or just fetched entry is not refetched on every mount;
// queries that need fresher data set their own.
const DEFAULT_STALE_TIME_MS = 60_000;

function isClientError(status: number) {
  return status >= 400 && status < 500;
}

function isAborted(error: unknown) {
  return (
    isCancelledError(error) ||
    isCancel(error) ||
    (error instanceof DOMException && error.name === "AbortError")
  );
}

function isOffline() {
  // onlineManager starts out online and only learns otherwise from an offline event.
  return (
    !onlineManager.isOnline() ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  );
}

/**
 * A network failure stays retryable, because React Query pauses a retry while offline and
 * resumes it on reconnect. A parse failure would fail the same way again.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= MAX_QUERY_RETRIES || error instanceof ZodError) {
    return false;
  }

  const status = httpStatus(error);
  return (
    status === undefined ||
    !isClientError(status) ||
    RETRYABLE_CLIENT_STATUSES.has(status)
  );
}

/** True for failures nobody caused on purpose: server errors, network faults while online, parse errors. */
export function isUnexpectedFailure(error: unknown) {
  if (isAborted(error)) return false;
  if (isNetworkFailure(error)) return !isOffline();

  const status = httpStatus(error);
  return status === undefined || !isClientError(status);
}

function reportUnexpectedFailure(error: unknown, key: QueryKey | undefined) {
  if (!isUnexpectedFailure(error)) return;

  // Only the root: deeper key parts can hold search terms, list ids and EANs.
  const root = key?.[0];
  Sentry.captureException(
    error,
    typeof root === "string" ? { tags: { queryKeyRoot: root } } : undefined,
  );
}

export function createQueryClientConfig(): QueryClientConfig {
  return {
    queryCache: new QueryCache({
      onError: (error, query) => reportUnexpectedFailure(error, query.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        reportUnexpectedFailure(error, mutation.options.mutationKey),
    }),
    defaultOptions: {
      queries: {
        // Must be >= the persister's maxAge, or entries evict before restoring.
        gcTime: OFFLINE_CACHE_MAX_AGE_MS,
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
    },
  };
}
