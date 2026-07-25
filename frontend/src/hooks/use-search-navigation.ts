"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface IUseSearchNavigationResult {
  /** The `q` param, empty unless the search route is the current page */
  routeQuery: string;
  /** True when submitting this query would leave the page exactly as it is */
  isUnchanged: (query: string) => boolean;

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
  const routeQuery = isOnRoute ? (searchParams.get("q") ?? "") : "";

  // Existing query params survive a search from the route itself; from elsewhere it starts clean.
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
      // Navigating re-runs the caller's effect, so bail once the URL already matches.
      if (isOnRoute && routeQuery === query) return;

      if (query) {
        router.replace(buildSearchUrl(query));
      } else {
        router.push(buildSearchUrl(""));
      }
    },
    [isOnRoute, routeQuery, buildSearchUrl, router],
  );

  // Off the route every query is a change, since submitting navigates there. The
  // filters need no comparison: each pick writes itself to the URL as you make it,
  // so they are never waiting on a submit.
  //
  // An empty field counts as unchanged even over a searched page, because the
  // clear button drops the query itself. Comparing it instead would light the
  // button up for the render between the field emptying and the URL following.
  const isUnchanged = useCallback(
    (query: string) => {
      const trimmed = query.trim();

      return !trimmed || trimmed === routeQuery;
    },
    [routeQuery],
  );

  const openResult = useCallback(
    (value: string) =>
      router.push(`${searchRoute}/${encodeURIComponent(value)}`),
    [router, searchRoute],
  );

  return { routeQuery, isUnchanged, search, syncQuery, openResult };
}
