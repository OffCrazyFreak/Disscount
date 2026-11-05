import * as Sentry from "@sentry/nextjs";
import {
  isCancelledError,
  MutationCache,
  onlineManager,
  QueryCache,
  type Query,
  type QueryClientConfig,
  type QueryKey,
} from "@tanstack/react-query";
import { isCancel } from "axios";
import { ZodError } from "zod";

import { httpStatus } from "@/lib/offline/failure-policy";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

// An entry gc'd from memory also leaves the persisted snapshot at its next save.
const UNWATCHED_QUERY_GC_TIME_MS = 7 * 24 * 60 * 60 * 1000;

// One retry: a blip gets a second chance, a real failure surfaces fast.
const MAX_QUERY_RETRIES = 1;

// Client errors a second attempt can fix: the request timed out, or we were throttled.
const RETRYABLE_CLIENT_STATUSES = new Set([408, 429]);

// An entry younger than this is not refetched on mount, focus or reconnect; queries needing fresher data set their own.
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

export function isOffline() {
  // onlineManager starts out online and only learns otherwise from an offline event.
  return (
    !onlineManager.isOnline() ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  );
}

/** Network failures retry because React Query pauses offline; a parse failure would just repeat. */
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
  // Offline, every request fails, and fetch() rejects with a TypeError axios never sees.
  if (isAborted(error) || isOffline()) return false;
  if (isNetworkFailure(error)) return true;

  const status = httpStatus(error);
  return status === undefined || !isClientError(status);
}

function reportUnexpectedFailure(error: unknown, key: QueryKey | undefined) {
  if (!isUnexpectedFailure(error)) return false;

  // Only the root: deeper key parts can hold search terms, list ids and EANs.
  const root = key?.[0];
  const queryKeyRoot = typeof root === "string" ? root : "unknown";
  const status = httpStatus(error);

  Sentry.captureException(error, {
    tags: { queryKeyRoot, httpStatus: status ?? "none" },
    // Axios names only the status in its message, so every endpoint's 5xx would group into one issue.
    fingerprint:
      status === undefined
        ? undefined
        : ["{{ default }}", queryKeyRoot, String(status)],
  });

  return true;
}

// A failing query that polls or refetches on focus fails repeatedly, so one event per streak is enough.
const queriesReportedFailing = new WeakSet<Query<unknown, unknown, unknown>>();

export function createQueryClientConfig(): QueryClientConfig {
  return {
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (queriesReportedFailing.has(query)) return;
        if (reportUnexpectedFailure(error, query.queryKey)) {
          queriesReportedFailing.add(query);
        }
      },
      onSuccess: (_data, query) => queriesReportedFailing.delete(query),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        reportUnexpectedFailure(error, mutation.options.mutationKey),
    }),
    defaultOptions: {
      queries: {
        gcTime: UNWATCHED_QUERY_GC_TIME_MS,
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
    },
  };
}
