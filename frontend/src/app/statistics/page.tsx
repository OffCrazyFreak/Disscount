"use client";

import React, { useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Package,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";
import cijeneService from "@/app/products/api";
import { storeNamesMap } from "@/lib/utils/mappings";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/generic";

// Memoized component for individual chain items to prevent unnecessary re-renders
const ChainItem = memo(
  ({
    stat,
    isExpanded,
    onToggle,
    storesByChainCode,
    allStoresLoading,
    index,
    isLast,
  }: {
    stat: any;
    isExpanded: boolean;
    onToggle: () => void;
    storesByChainCode: Record<string, any[]>;
    allStoresLoading: boolean;
    index: number;
    isLast: boolean;
  }) => {
    return (
      <div>
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 size-12 sm:size-16 rounded-sm overflow-hidden shadow-sm">
                <Image
                  src={`/store-chains/${stat.chain_code}.png`}
                  alt={storeNamesMap[stat.chain_code]}
                  width="256"
                  height="256"
                  className=" object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {storeNamesMap[stat.chain_code]}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 sm:gap-4 flex-wrap my-2">
                      <span className="flex items-center gap-2">
                        <MapPin className="size-5 mb-1" />
                        {stat.store_count}{" "}
                        {parseInt(stat.store_count.toString().slice(-1)) > 1 &&
                        parseInt(stat.store_count.toString().slice(-1)) < 5 &&
                        stat.store_count > 21
                          ? "trgovine"
                          : "trgovina"}
                      </span>
                      <span className="hidden sm:inline">|</span>
                      <span className="flex items-center gap-2">
                        <Tag className="size-5 mb-1" />
                        {stat.price_count}{" "}
                        {parseInt(stat.price_count.toString().slice(-1)) > 1 &&
                        parseInt(stat.price_count.toString().slice(-1)) < 5 &&
                        stat.price_count > 21
                          ? "cijene"
                          : "cijena"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        "size-8 text-gray-500 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-4">
              {allStoresLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin mr-2" />
                  Učitavanje trgovina...
                </div>
              ) : storesByChainCode[stat.chain_code] ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Grad</TableHead>
                          <TableHead>Adresa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storesByChainCode[stat.chain_code].map(
                          (store, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-gray-700 text-xs">
                                {store.city || "Nepoznato"}
                              </TableCell>
                              <TableCell className="text-gray-700 text-xs">
                                {store.address || "Nepoznato"}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nema podataka o trgovinama
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!isLast && <Separator className="my-4" />}
      </div>
    );
  }
);

ChainItem.displayName = "ChainItem";

export default function StatisticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [eanQuery, setEanQuery] = useState("");
  const [expandedChain, setExpandedChain] = useState<string | null>(null);
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const [submittedEanQuery, setSubmittedEanQuery] = useState("");

  // Hooks for different API calls
  const { data: health, isLoading: healthLoading } =
    cijeneService.useHealthCheck();

  const { data: chainStats, isLoading: statsLoading } =
    cijeneService.useGetChainStats();

  const { data: allStores, isLoading: allStoresLoading } =
    cijeneService.useListAllStores();

  const {
    data: searchResults,
    isLoading: searchLoading,
    refetch: refetchSearch,
  } = cijeneService.useSearchProducts({ q: submittedSearchQuery });

  const {
    data: productByEan,
    isLoading: eanLoading,
    refetch: refetchEan,
  } = cijeneService.useGetProductByEan({ ean: submittedEanQuery });

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

  const handleSearchProducts = () => {
    if (searchQuery.trim()) {
      setSubmittedSearchQuery(searchQuery);
    }
  };

  const handleSearchByEan = () => {
    if (eanQuery.trim()) {
      setSubmittedEanQuery(eanQuery);
    }
  };

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

      {/* Product Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Pretraživanje proizvoda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Unesite naziv proizvoda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearchProducts()}
            />
            <Button onClick={handleSearchProducts} disabled={searchLoading}>
              {searchLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>

          {searchResults && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Pronađeno {searchResults.products.length} proizvoda
              </div>

              <div className="max-h-128 overflow-y-auto space-y-2">
                {searchResults.products.map((product) => {
                  const minPrice =
                    product.chains.length > 0
                      ? Math.min(
                          ...product.chains.map((c) => parseFloat(c.min_price))
                        )
                      : undefined;
                  const maxPrice =
                    product.chains.length > 0
                      ? Math.max(
                          ...product.chains.map((c) => parseFloat(c.max_price))
                        )
                      : undefined;

                  return (
                    <div key={product.ean} className="p-3 border rounded-lg">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        {product.brand} | EAN: {product.ean}
                      </div>
                      <div className="text-sm">
                        Cijena: {minPrice?.toFixed(2)}€ - {maxPrice?.toFixed(2)}
                        €
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product by EAN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Pretraživanje po EAN kodu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Unesite EAN kod..."
              value={eanQuery}
              onChange={(e) => setEanQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearchByEan()}
            />
            <Button onClick={handleSearchByEan} disabled={eanLoading}>
              {eanLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>

          {productByEan && (
            <div className="p-3 border rounded-lg">
              <div className="font-medium">{productByEan.name}</div>
              <div className="text-sm text-gray-600">
                {productByEan.brand} | EAN: {productByEan.ean}
              </div>
              <div className="text-sm mt-2">
                Dostupno u {productByEan.chains.length} lanca:
              </div>

              <div className="">
                {productByEan.chains.map((chain) => (
                  <div key={chain.chain} className="text-xs text-gray-500 ml-2">
                    {chain.chain}: {chain.min_price}€ - {chain.max_price}€
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
