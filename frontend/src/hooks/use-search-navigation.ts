"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { decodeQuerySafely } from "@/utils/strings";

export interface IUseSearchNavigationResult {
  /** The `q` param, empty unless the search route is the current page */
  routeQuery: string;
  /** Navigates to the search route, adding the query to the history */
  search: (query: string) => void;
  /** Mirrors the query into `q` without adding a history entry */
  syncQuery: (query: string) => void;
  /** Opens a single result's page nested under the search route */
  openResult: (value: string) => void;
}

function normalizePath(path: string): string {
  return path.replace(/\/$/, "");
}

/** Reads and writes the `q` param of a search route, leaving other params be. */
export function useSearchNavigation(
  searchRoute: string,
): IUseSearchNavigationResult {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isOnRoute = normalizePath(pathname) === normalizePath(searchRoute);
  const routeQuery = isOnRoute
    ? decodeQuerySafely(searchParams.get("q") || "")
    : "";

  // Other params (e.g. active filters) survive a search from the route itself,
  // while searching from elsewhere starts clean.
  const buildSearchUrl = useCallback(
    (query: string) => {
      const params = new URLSearchParams(
        isOnRoute ? searchParams.toString() : "",
      );

      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      const queryString = params.toString();
      return queryString ? `${searchRoute}?${queryString}` : searchRoute;
    },
    [isOnRoute, searchParams, searchRoute],
  );

  const search = useCallback(
    (query: string) => router.push(buildSearchUrl(query)),
    [router, buildSearchUrl],
  );

  const syncQuery = useCallback(
    (query: string) => {
      // Navigating re-creates searchParams, which re-runs the caller's effect,
      // so bail out once the URL already carries what the input holds.
      if (isOnRoute && routeQuery === query) return;

      if (query) {
        router.replace(buildSearchUrl(query));
      } else {
        router.push(buildSearchUrl(""));
      }
    },
    [isOnRoute, routeQuery, buildSearchUrl, router],
  );

  const openResult = useCallback(
    (value: string) => router.push(`${searchRoute}/${encodeURIComponent(value)}`),
    [router, searchRoute],
  );

  return { routeQuery, search, syncQuery, openResult };
}
