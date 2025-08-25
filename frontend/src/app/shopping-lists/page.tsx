"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, Loader2, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button2";
import ShoppingListCard from "@/components/shopping-lists/shopping-list-card";
import ShoppingListCard2 from "@/components/shopping-lists/slc";
import ShoppingListsSearchBar from "@/components/shopping-lists/shopping-list-search-bar";
import ShoppingListModal from "@/components/forms/shopping-list-modal";
import { normalizeForSearch } from "@/lib/utils";
import { shoppingListService } from "@/lib/api";
import { AnimatedGroup } from "@/components/ui/animated-group";

export default function ShoppingListsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: shoppingLists = [],
    isLoading,
    error,
    refetch,
  } = shoppingListService.useGetCurrentUserShoppingLists();

  function handleSearch(q: string) {
    if (!q) {
      router.push(`/shopping-lists`);
    } else {
      router.push(`/shopping-lists?q=${encodeURIComponent(q)}`);
    }
  }

  const handleCreateSuccess = () => {
    refetch();
  };

  // Filter shoppingLists based on normalized search query (handles Croatian & German letters)
  const qNorm = normalizeForSearch(initialQuery || "");
  const filteredShoppingLists = shoppingLists.filter((list) => {
    if (!initialQuery) return true; // no query -> show all (handled by UI states)

    // Search against both original and normalized text
    const query = initialQuery.toLowerCase();
    const title = list.title || "";

    // Check original text (case-insensitive)
    const originalMatches = title.toLowerCase().includes(query);

    // Check normalized text (diacritic-insensitive)
    const titleNorm = normalizeForSearch(title);
    const normalizedMatches = titleNorm.includes(qNorm);

    return originalMatches || normalizedMatches;
  });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <h3 className="text-lg font-semibold mb-2">
              Greška pri dohvaćanju
            </h3>
            <p>Došlo je do greške prilikom dohvaćanja shopping lista.</p>
          </div>
          <Button onClick={() => refetch()}>Pokušaj ponovno</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="my-4 flex gap-4 items-center">
        <div className="flex-1">
          <ShoppingListsSearchBar
            onSearch={handleSearch}
            showSubmitButton
            showBarcode={false}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="size-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Dohvaćanje shopping lista...</p>
        </div>
      )}

      {/* ShoppingLists List */}
      {!isLoading && (
        <div className="space-y-4">
          {initialQuery && filteredShoppingLists.length === 0 ? (
            <div className="text-center py-12">
              <Search className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nema rezultata
              </h3>
              <p className="text-gray-600">
                Probajte s drugim pojmom za pretraživanje
              </p>
            </div>
          ) : initialQuery ? (
            <>
              <h2 className="text-lg my-8">
                Rezultati pretrage za &quot;{initialQuery}&quot; (
                {filteredShoppingLists.length})
              </h2>

              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  item: {
                    hidden: {
                      opacity: 0,
                      filter: "blur(12px)",
                      y: 12,
                    },
                    visible: {
                      opacity: 1,
                      filter: "blur(0px)",
                      y: 0,
                      transition: {
                        type: "spring" as const,
                        bounce: 0.3,
                        duration: 1.5,
                      },
                    },
                  },
                }}
                className="space-y-4"
              >
                {filteredShoppingLists.map((shoppingList) => (
                  <>
                    <ShoppingListCard
                      key={shoppingList.id}
                      shoppingList={shoppingList}
                    />

                    <ShoppingListCard2 shoppingList={shoppingList} />
                  </>
                ))}
              </AnimatedGroup>
            </>
          ) : shoppingLists.length === 0 ? (
            <div className="text-center py-12">
              <Plus className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nema shopping lista
              </h3>
              <p className="text-gray-600 mb-6">
                Stvorite svoju prvu shopping listu i počnite organizirati
                kupovinu
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Stvori prvu listu
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">
                  Moje shopping liste ({shoppingLists.length})
                </h2>
              </div>
              {shoppingLists.map((shoppingList) => (
                <ShoppingListCard
                  key={shoppingList.id}
                  shoppingList={shoppingList}
                />
              ))}
            </>
          )}
        </div>
      )}

      <div className="fixed bottom-16 right-4 z-50">
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="size-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
        >
          <PlusIcon className="size-6" />
          <span className="sr-only">Dodaj novu shopping listu</span>
        </Button>
      </div>

      <Button onClick={() => setIsModalOpen(true)}></Button>

      <ShoppingListModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
