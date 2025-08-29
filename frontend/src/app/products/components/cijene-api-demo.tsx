"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Store, Package, TrendingUp } from "lucide-react";
import cijeneService from "@/app/products/api";

export default function CijeneApiDemo() {
  const [searchQuery, setSearchQuery] = useState("");
  const [eanQuery, setEanQuery] = useState("");
  const [chainCode, setChainCode] = useState("");

  // Hooks for different API calls
  const { data: chains, isLoading: chainsLoading } =
    cijeneService.useListChains();

  const { data: health, isLoading: healthLoading } =
    cijeneService.useHealthCheck();

  const { data: chainStats, isLoading: statsLoading } =
    cijeneService.useGetChainStats();

  const {
    data: searchResults,
    isLoading: searchLoading,
    refetch: refetchSearch,
  } = cijeneService.useSearchProducts({ q: searchQuery });

  const {
    data: productByEan,
    isLoading: eanLoading,
    refetch: refetchEan,
  } = cijeneService.useGetProductByEan({ ean: eanQuery });

  const {
    data: storesByChain,
    isLoading: storesLoading,
    refetch: refetchStores,
  } = cijeneService.useListStoresByChain(chainCode);

  const handleSearchProducts = () => {
    if (searchQuery.trim()) {
      refetchSearch();
    }
  };

  const handleSearchByEan = () => {
    if (eanQuery.trim()) {
      refetchEan();
    }
  };

  const handleSearchStores = () => {
    if (chainCode.trim()) {
      refetchStores();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Cijene API Demo</h1>
        <p className="text-gray-600">
          Test svih dostupnih Cijene API endpoints
        </p>
      </div>

      {/* Health Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Health Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Provjera stanja...
            </div>
          ) : health ? (
            <div className="text-green-600">✅ API je dostupan</div>
          ) : (
            <div className="text-red-600">❌ API nije dostupan</div>
          )}
        </CardContent>
      </Card>

      {/* Chains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5" />
            Dostupni trgovinski lanci ({chains?.chains.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chainsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Učitavanje...
            </div>
          ) : chains ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {chains.chains.map((chain) => (
                <div
                  key={chain}
                  className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                  onClick={() => setChainCode(chain)}
                >
                  {chain}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">Nema podataka</div>
          )}
        </CardContent>
      </Card>

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
            <div className="space-y-2">
              {chainStats.chain_stats.map((stat) => (
                <div
                  key={stat.chain_code}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span className="font-medium">{stat.chain_code}</span>
                  <div className="text-sm text-gray-600">
                    {stat.price_count} cijene, {stat.store_count} trgovine
                  </div>
                </div>
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
                      Cijena: {minPrice?.toFixed(2)}€ - {maxPrice?.toFixed(2)}€
                    </div>
                  </div>
                );
              })}
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
              {productByEan.chains.map((chain) => (
                <div key={chain.chain} className="text-xs text-gray-500 ml-2">
                  {chain.chain}: {chain.min_price}€ - {chain.max_price}€
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stores by Chain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5" />
            Trgovine po lancu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Unesite kod lanca (npr. konzum)"
              value={chainCode}
              onChange={(e) => setChainCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchStores()}
            />
            <Button onClick={handleSearchStores} disabled={storesLoading}>
              {storesLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>

          {storesByChain && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Pronađeno {storesByChain.stores.length} trgovina
              </div>
              {storesByChain.stores.map((store) => (
                <div key={store.code} className="p-2 border rounded">
                  <div className="font-medium">{store.address}</div>
                  <div className="text-sm text-gray-600">
                    {store.city} {store.zipcode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
