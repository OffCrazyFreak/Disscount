"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import AsyncSection from "@/components/custom/common/async-section";
import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import StatisticsStoreItemSkeleton from "@/app/statistics/components/store-item-skeleton";
import { useDataPending } from "@/lib/query/use-data-pending";
import cijeneService from "@/lib/cijene-api";
import StoreItem from "@/app/statistics/components/store-item";

export default function ChainList() {
  const [expandedChain, setExpandedChain] = useState<string | null>(null);

  const {
    data: chainStats,
    isPending,
    error,
  } = cijeneService.useGetChainStats();

  const pending = useDataPending(isPending);

  function toggleChainExpansion(chainCode: string) {
    setExpandedChain((prev) => (prev === chainCode ? null : chainCode));
  }

  const sortedStats = [...(chainStats?.chain_stats ?? [])].sort((a, b) =>
    a.chain_code.localeCompare(b.chain_code, "hr", { sensitivity: "base" }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          Statistike po lancima
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AsyncSection
          pending={pending}
          error={error}
          isEmpty={sortedStats.length === 0}
          empty={<div className="text-gray-500">Nema podataka</div>}
          skeleton={
            <RepeatSkeleton count={5}>
              <StatisticsStoreItemSkeleton />
            </RepeatSkeleton>
          }
        >
          <div>
            {sortedStats.map((stat, index) => (
              <StoreItem
                key={stat.chain_code}
                stat={stat}
                isExpanded={expandedChain === stat.chain_code}
                onToggle={() => toggleChainExpansion(stat.chain_code)}
                isLast={index === sortedStats.length - 1}
              />
            ))}
          </div>
        </AsyncSection>
      </CardContent>
    </Card>
  );
}
