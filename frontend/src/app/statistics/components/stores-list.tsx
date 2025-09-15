"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import cijeneService from "@/lib/cijene-api";
import { StoreItem } from "@/app/statistics/components/store-item";
import { ChainStats } from "@/lib/cijene-api/schemas";

export default function ChainList() {
  const [expandedChain, setExpandedChain] = useState<string | null>(null);

  const { data: chainStats, isLoading: statsLoading } =
    cijeneService.useGetChainStats();

  const toggleChainExpansion = React.useCallback((chainCode: string) => {
    setExpandedChain((prev: string | null) =>
      prev === chainCode ? null : chainCode
    );
  }, []);

  const chainToggleHandlers = React.useMemo(() => {
    if (!chainStats?.chain_stats) return {};

    const handlers: Record<string, () => void> = {};
    chainStats.chain_stats.forEach((stat: ChainStats) => {
      handlers[stat.chain_code] = () => toggleChainExpansion(stat.chain_code);
    });
    return handlers;
  }, [chainStats?.chain_stats, toggleChainExpansion]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          Statistike po lancima
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Učitavanje...
          </div>
        ) : chainStats ? (
          <div>
            {chainStats.chain_stats
              .sort((a: ChainStats, b: ChainStats) =>
                a.chain_code.localeCompare(b.chain_code, "hr", {
                  sensitivity: "base",
                })
              )
              .map((stat: ChainStats, index: number) => (
                <StoreItem
                  key={stat.chain_code}
                  stat={stat}
                  isExpanded={expandedChain === stat.chain_code}
                  onToggle={chainToggleHandlers[stat.chain_code]}
                  isLast={index === chainStats.chain_stats.length - 1}
                />
              ))}
          </div>
        ) : (
          <div className="text-gray-500">Nema podataka</div>
        )}
      </CardContent>
    </Card>
  );
}
