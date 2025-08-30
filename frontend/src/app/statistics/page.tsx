"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import cijeneService from "@/app/products/api";
import Image from "next/image";
import { cn } from "@/lib/utils/generic";
import { ChainItem } from "./components/chain-item";

export default function StatisticsPage() {
  const [expandedChain, setExpandedChain] = useState<string | null>(null);

  // Hooks for different API calls
  const { data: health, isLoading: healthLoading } =
    cijeneService.useHealthCheck();

  const { data: chainStats, isLoading: statsLoading } =
    cijeneService.useGetChainStats();

  const { data: allStores, isLoading: allStoresLoading } =
    cijeneService.useListAllStores();

  const toggleChainExpansion = React.useCallback((chainCode: string) => {
    setExpandedChain((prev) => (prev === chainCode ? null : chainCode));
  }, []);

  // Create memoized toggle handlers for each chain
  const chainToggleHandlers = React.useMemo(() => {
    if (!chainStats?.chain_stats) return {};

    const handlers: Record<string, () => void> = {};
    chainStats.chain_stats.forEach((stat) => {
      handlers[stat.chain_code] = () => toggleChainExpansion(stat.chain_code);
    });
    return handlers;
  }, [chainStats?.chain_stats, toggleChainExpansion]);
  const storesByChainCode = React.useMemo(() => {
    if (!allStores) return {};

    const grouped: Record<string, typeof allStores.stores> = {};
    allStores.stores.forEach((store) => {
      if (!grouped[store.chain_code]) {
        grouped[store.chain_code] = [];
      }
      grouped[store.chain_code].push(store);
    });
    return grouped;
  }, [allStores]);

  return (
    <div className="container space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-4">
          {/* App logo */}
          <Image
            src="/disscount-logo.png"
            alt="Disscount logo"
            width={128}
            height={128}
            className="size-16"
          />
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Disscount</span> Statistika
          </h1>
        </div>
      </div>

      {/* Health Check */}
      {healthLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Provjera stanja...
        </div>
      ) : health ? (
        <div className="text-green-600">✅ Cijene API je dostupan</div>
      ) : (
        <div className="text-red-600">❌ Cijene API nije dostupan</div>
      )}

      {/* Chain Stats */}
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
            <div className="">
              {chainStats.chain_stats
                .sort((a, b) => a.chain_code.localeCompare(b.chain_code))
                .map((stat, index) => (
                  <ChainItem
                    key={stat.chain_code}
                    stat={stat}
                    isExpanded={expandedChain === stat.chain_code}
                    onToggle={chainToggleHandlers[stat.chain_code]}
                    storesByChainCode={storesByChainCode}
                    allStoresLoading={allStoresLoading}
                    index={index}
                    isLast={index === chainStats.chain_stats.length - 1}
                  />
                ))}
            </div>
          ) : (
            <div className="text-gray-500">Nema podataka</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
