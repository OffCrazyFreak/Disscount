import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import cijeneService from "@/lib/cijene-api";

export type PerChainPoint = {
  date: string;
  [chain: string]: number | null | undefined | string;
};

interface UsePriceHistoryArgs {
  ean: string;
  /** Number of days back INCLUDING today. Pass -1 for all available history, capped to not go earlier than 2025-05-16. */
  days?: number;
}

/**
 * Fetch product price snapshots for the last N days in parallel and shape data
 * as an array of objects: { date: 'YYYY-MM-DD', [chainCode]: avgPrice }
 *
 * @param ean - Product EAN code
 * @param days - Number of days to fetch (default 7). Pass -1 for all available history, capped to not go earlier than 2025-05-16
 * @returns Object containing chart data, chains, loading/error states, and Y-axis domain
 */
export function usePriceHistory({ ean, days = 7 }: UsePriceHistoryArgs) {
  const dates = useMemo(() => {
    const arr: string[] = [];
    const today = new Date();
    const startCap = new Date("2025-05-16");

    // Cap days to not go earlier than start date
    const maxDaysFromCap = Math.max(
      0,
      Math.ceil((today.getTime() - startCap.getTime()) / (1000 * 60 * 60 * 24))
    );

    let cappedDays: number;
    if (days === -1) {
      cappedDays = maxDaysFromCap;
    } else {
      cappedDays = Math.min(days, maxDaysFromCap);
    }

    for (let i = 0; i < cappedDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr.reverse(); // chronological
  }, [days]);

  const queries = useQueries({
    queries: dates.map((date) => ({
      queryKey: ["cijene", "product", "history", ean, date],
      queryFn: () => cijeneService.getProductByEan({ ean, date }),
      enabled: !!ean,
      staleTime: 6 * 60 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const { data, chains } = useMemo(() => {
    // collect all chain codes seen across all days
    const chainSet = new Set<string>();

    const rows: PerChainPoint[] = dates.map((date, idx) => {
      const q = queries[idx];
      const product = q?.data as any;
      const row: PerChainPoint = { date };
      if (!product || !product.chains) return row;

      product.chains.forEach((c: any) => {
        const code = c.chain;
        chainSet.add(code);
        const avg = parseFloat(c.avg_price ?? "");
        row[code] = isNaN(avg) ? null : avg;
      });
      return row;
    });

    return { data: rows, chains: Array.from(chainSet) };
  }, [queries, dates]);

  // Compute domain across all chains and days with 10% padding
  const domain = useMemo(() => {
    const values: number[] = [];
    data.forEach((r) => {
      Object.keys(r).forEach((k) => {
        if (k === "date") return;
        const v = r[k] as number | null | undefined;
        if (typeof v === "number" && !isNaN(v)) values.push(v);
      });
    });
    if (values.length === 0) return { min: 0, max: 0 };
    const globalMin = Math.min(...values);
    const globalMax = Math.max(...values);
    return {
      min: +(globalMin * 0.9).toFixed(2),
      max: +(globalMax * 1.1).toFixed(2),
    };
  }, [data]);

  return { data, chains, isLoading, isError, domain, days: dates.length };
}

export default usePriceHistory;
