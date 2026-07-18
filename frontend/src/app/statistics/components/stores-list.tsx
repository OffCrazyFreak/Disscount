"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import cijeneService from "@/lib/cijene-api";
import StoreItem from "@/app/statistics/components/store-item";

export default function ChainList() {
  const [expandedChain, setExpandedChain] = useState<string | null>(null);

  const { data: chainStats, isLoading: statsLoading } =
    cijeneService.useGetChainStats();

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
        {statsLoading ? (
          <div className="flex items-center gap-2">
            <BlockLoadingSpinner size={16} />
            Učitavanje...
          </div>
        ) : chainStats ? (
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
        ) : (
          <div className="text-gray-500">Nema podataka</div>
        )}
      </CardContent>
    </Card>
  );
}
