"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Loader2,
  PlusIcon,
  ClipboardEdit,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button2";
import ShoppingListCard from "@/components/custom/shopping-lists/shopping-list-card";
import ShoppingListsSearchBar from "@/components/custom/shopping-lists/shopping-list-search-bar";
import ShoppingListModal from "@/components/custom/forms/shopping-list-modal";
import { ShoppingListDto } from "@/lib/api/types";
import { filterByFields } from "@/lib/utils";
import { shoppingListService } from "@/lib/api";
import { AnimatedGroup } from "@/components/ui/animated-group";
import ShoppingListsGroup from "@/components/custom/shopping-lists/shopping-lists-group";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import NoResults from "@/components/custom/no-results";

export default function ShoppingListsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShoppingList, setSelectedShoppingList] =
    useState<ShoppingListDto | null>(null);

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

  const handleEdit = (shoppingList: ShoppingListDto) => {
    setSelectedShoppingList(shoppingList);
    setIsModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) setSelectedShoppingList(null);
  };

  const filteredShoppingLists = filterByFields(shoppingLists, initialQuery, [
    "title",
  ]);

  return (
    <>
      <ShoppingListModal
        isOpen={isModalOpen}
        onOpenChange={handleModalOpenChange}
        onSuccess={handleCreateSuccess}
        shoppingList={selectedShoppingList}
      />

      <FloatingActionButton
        onClick={() => setIsModalOpen(true)}
        icon={<PlusIcon size={24} />}
        label="Izradi shopping listu"
      />

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
              <NoResults
                icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
              />
            ) : initialQuery ? (
              <>
                <h2 className="text-lg my-8">
                  Rezultati pretrage za &quot;{initialQuery}&quot; (
                  {filteredShoppingLists.length})
                </h2>

                <ShoppingListsGroup
                  shoppingLists={filteredShoppingLists}
                  onEdit={handleEdit}
                />
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
                <Button size={"lg"} onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Stvori prvu listu
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <h2>Moje shopping liste ({shoppingLists.length})</h2>

                <ShoppingListsGroup
                  shoppingLists={filteredShoppingLists}
                  onEdit={handleEdit}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
