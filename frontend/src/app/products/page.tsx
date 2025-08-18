"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, ArrowUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";
import { productApi, type Product } from "@/lib/api-client";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [sortBy, setSortBy] = useState<"price" | "name" | "store">("price");
  const [filterStore, setFilterStore] = useState<string>("");

  const {
    data: searchResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", query],
    queryFn: () => productApi.searchProducts(query),
    enabled: !!query,
  });

  const products = searchResponse?.products || [];

  const sortedAndFilteredProducts = products
    .filter((product) => !filterStore || product.store === filterStore)
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "store":
          return a.store.localeCompare(b.store);
        default:
          return 0;
      }
    });

  const uniqueStores = [...new Set(products.map((p) => p.store))];

  if (!query) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Nema pretrage
            </h1>
            <p className="text-gray-600">
              Molimo unesite pojam za pretraživanje.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* <Header /> */}
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Rezultati pretrage za "{query}"
            </h1>
            <p className="text-gray-600">
              {isLoading
                ? "Pretraživanje..."
                : `Pronađeno ${sortedAndFilteredProducts.length} proizvoda`}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="lg:w-64 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Filter className="size-4 mr-2" />
                  Filtri
                </h3>

                {/* Store Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trgovina
                  </label>
                  <select
                    value={filterStore}
                    onChange={(e) => setFilterStore(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Sve trgovine</option>
                    {uniqueStores.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ArrowUpDown className="size-4 inline mr-1" />
                    Sortiraj po
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "price" | "name" | "store")
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="price">Cijeni (najniža prvo)</option>
                    <option value="name">Nazivu</option>
                    <option value="store">Trgovini</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
                    >
                      <div className="h-32 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-red-600">
                    Greška pri dohvaćanju proizvoda
                  </p>
                </div>
              ) : sortedAndFilteredProducts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <Search className="size-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nema rezultata
                  </h3>
                  <p className="text-gray-600">
                    Probajte s drugim pojmom za pretraživanje
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedAndFilteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                    >
                      {/* Product Image Placeholder */}
                      <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          Slika proizvoda
                        </span>
                      </div>

                      {/* Product Info */}
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>

                      {/* Category */}
                      {product.category && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
                          {product.category}
                        </span>
                      )}

                      {/* Price */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {product.price.toFixed(2)} €
                          </span>
                          {product.discount && product.originalPrice && (
                            <>
                              <span className="text-sm text-gray-500 line-through">
                                {product.originalPrice.toFixed(2)} €
                              </span>
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                -{product.discount}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Store Info */}
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900">
                          {product.store}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="size-4 mr-1" />
                          {product.location}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button className="w-full mt-4" variant="outline">
                        Dodaj u listu
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
