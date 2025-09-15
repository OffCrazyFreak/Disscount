"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Plus, Loader2, PlusIcon, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/custom/search-bar";
import ShoppingListModal from "@/app/(user)/shopping-lists/components/forms/shopping-list-modal";
import { ShoppingListDto } from "@/lib/api/types";
import { useViewMode } from "@/hooks/use-view-mode";
import { filterByFields } from "@/utils/generic";
import { shoppingListService } from "@/lib/api";
import ShoppingListsGroup from "@/app/(user)/shopping-lists/components/shopping-lists-group";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import NoResults from "@/components/custom/no-results";
import { useUser } from "@/context/user-context";
import ViewSwitcher from "@/components/custom/view-switcher";

export default function ShoppingListsClient({ query }: { query: string }) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShoppingList, setSelectedShoppingList] =
    useState<ShoppingListDto | null>(null);
  const [viewMode, setViewMode] = useViewMode(pathname, "grid");

  // Use user context for authentication and shopping lists data
  const { isAuthenticated, isLoading: userLoading } = useUser();

  // React Query hook - always enabled for authenticated users
  const {
    data: shoppingLists = [],
    isLoading: isLoadingLists,
    refetch,
  } = shoppingListService.useGetCurrentUserShoppingLists();

  // Use React Query data and loading state
  const isLoading = userLoading || isLoadingLists;

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

  const filteredShoppingLists = filterByFields(shoppingLists, query, ["title"]);

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
        label="Izradi popis"
      />

      <div className="space-y-4">
        <Suspense>
          <SearchBar
            placeholder="Pretraži popise za kupnju..."
            searchRoute={pathname}
            clearable={true}
            submitButtonLocation="none"
            autoSearch={true}
          />
        </Suspense>

        <div className="flex items-center justify-between gap-4">
          <h3>
            {query.length > 0
              ? `Rezultati pretrage za "${query}" (${filteredShoppingLists.length})`
              : `Moji popisi za kupnju${
                  isLoading ? "" : ` (${filteredShoppingLists.length})`
                }`}
          </h3>

          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">
              Dohvaćanje popisa za kupnju...
            </span>
          </div>
        ) : filteredShoppingLists.length > 0 ? (
          <ShoppingListsGroup
            shoppingLists={filteredShoppingLists}
            onEdit={handleEdit}
            viewMode={viewMode}
          />
        ) : query ? (
          <NoResults
            icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
          />
        ) : (
          <div className="text-center py-12">
            <Frown className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nema popisa za kupnju
            </h3>
            <p className="text-gray-600 mb-6">
              Stvorite svoj prvi popis za kupnju i počnite organizirati kupovinu
            </p>
            <Button
              effect={"shineHover"}
              icon={Plus}
              iconPlacement="left"
              onClick={() => setIsModalOpen(true)}
            >
              Izradi novi popis za kupnju
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
