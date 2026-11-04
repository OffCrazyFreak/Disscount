"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

export interface IUseSearchNavigationResult {
  routeQuery: string;
  /** True when submitting this query would leave the page exactly as it is */
  isUnchanged: (query: string) => boolean;

  search: (query: string) => void;
  syncQuery: (query: string) => void;
  openResult: (value: string) => void;
}

export interface IUseSearchNavigationOptions {
  /** Rewrites `q` through the History API: no server render, and the hash (the map's view) survives. */
  shallow?: boolean;
}

function normalizePath(path: string): string {
  return path.replace(/\/$/, "");
}

export function useSearchNavigation(
  searchRoute: string,
  { shallow = false }: IUseSearchNavigationOptions = {},
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

  const navigate = useCallback(
    (url: string, mode: "push" | "replace") => {
      if (!shallow || !isOnRoute) {
        router[mode](url);
        return;
      }

      // searchRoute has no language prefix, so the browser's own path keeps /en/map on /en/map.
      const search = url.includes("?") ? url.slice(url.indexOf("?")) : "";
      const withHash = `${window.location.pathname}${search}${window.location.hash}`;

      if (mode === "push") window.history.pushState(null, "", withHash);
      else window.history.replaceState(null, "", withHash);
    },
    [shallow, isOnRoute, router],
  );

  const search = useCallback(
    (query: string) => navigate(buildSearchUrl(query), "push"),
    [navigate, buildSearchUrl],
  );

  const syncQuery = useCallback(
    (query: string) => {
      // Navigating re-runs the caller's effect, so bail once the URL already matches.
      if (isOnRoute && routeQuery === query) return;

      navigate(buildSearchUrl(query), query ? "replace" : "push");
    },
    [isOnRoute, routeQuery, buildSearchUrl, navigate],
  );

  // Filters write themselves to the URL, so they need no comparison; an empty field counts as unchanged because the clear button drops the query.
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
