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
  Frown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ShoppingListCard from "@/components/custom/shopping-lists/shopping-list-card";
import ShoppingListsSearchBar from "@/components/custom/shopping-lists/shopping-list-search-bar";
import SharedListLayout from "@/components/custom/shared-list-layout";
import ShoppingListModal from "@/components/custom/forms/shopping-list-modal";
import { ShoppingListDto } from "@/lib/api/types";
import { ViewMode } from "@/typings/view-mode";
import { useViewMode } from "@/hooks/use-view-mode";
import { filterByFields } from "@/lib/utils";
import { shoppingListService } from "@/lib/api";
import { AnimatedGroup } from "@/components/ui/animated-group";
import ShoppingListsGroup from "@/components/custom/shopping-lists/shopping-lists-group";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import NoResults from "@/components/custom/no-results";
import ViewSwitcher from "@/components/custom/view-switcher";

export default function ShoppingListsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShoppingList, setSelectedShoppingList] =
    useState<ShoppingListDto | null>(null);
  const [viewMode, setViewMode] = useViewMode("/shopping-lists", "grid");

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

      <SharedListLayout
        title={
          initialQuery.length > 0
            ? `Rezultati pretrage za "${initialQuery}" (${filteredShoppingLists.length})`
            : `Moje shopping liste (${filteredShoppingLists.length})`
        }
        search={
          <ShoppingListsSearchBar
            onSearch={handleSearch}
            showSubmitButton
            showBarcode={false}
          />
        }
        viewMode={viewMode}
        setViewMode={setViewMode}
      >
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="size-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Dohvaćanje shopping lista...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {filteredShoppingLists.length > 0 ? (
              <ShoppingListsGroup
                shoppingLists={filteredShoppingLists}
                onEdit={handleEdit}
                viewMode={viewMode}
              />
            ) : initialQuery.length > 0 ? (
              <NoResults
                icon={<Search className="size-20 text-gray-400 mx-auto mb-4" />}
              />
            ) : (
              <div className="text-center py-12">
                <Frown className="size-20 text-gray-400 mx-auto mb-4" />

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nema shopping lista
                </h3>

                <p className="text-gray-600 mb-6">
                  Stvorite svoju prvu shopping listu i počnite organizirati
                  kupovinu
                </p>

                <Button
                  effect={"shineHover"}
                  icon={Plus}
                  iconPlacement="left"
                  onClick={() => setIsModalOpen(true)}
                >
                  Izradi novu shopping listu
                </Button>
              </div>
            )}
          </>
        )}
      </SharedListLayout>
    </>
  );
}
