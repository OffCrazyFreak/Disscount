"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Plus, Loader2, PlusIcon, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShoppingListsSearchBar from "@/app/(user)/shopping-lists/components/shopping-list-search-bar";
import UserInventoryLayout from "@/app/(user)/layout";
import ShoppingListModal from "@/app/(user)/shopping-lists/components/forms/shopping-list-modal";
import { ShoppingListDto } from "@/lib/api/types";
import { useViewMode } from "@/hooks/use-view-mode";
import { filterByFields } from "@/utils/generic";
import { shoppingListService } from "@/lib/api";
import ShoppingListsGroup from "@/app/(user)/shopping-lists/components/shopping-lists-group";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import NoResults from "@/components/custom/no-results";
import { useUser } from "@/context/user-context";

export default function ShoppingListsClient({ query }: { query: string }) {
  const pathname = usePathname();
  const router = useRouter();
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

  function handleSearch(q: string) {
    if (!q) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?q=${encodeURIComponent(q)}`);
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

      <UserInventoryLayout
        title={
          query
            ? `Rezultati pretrage za "${query}" (${filteredShoppingLists.length})`
            : `Moji popisi za kupnju (${filteredShoppingLists.length})`
        }
        search={
          <Suspense>
            <ShoppingListsSearchBar
              onSearch={handleSearch}
              showSubmitButton
              showBarcode={false}
            />
          </Suspense>
        }
        viewMode={viewMode}
        setViewMode={setViewMode}
      >
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="size-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Dohvaćanje popisa za kupnju...</p>
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
            ) : query ? (
              <NoResults
                icon={<Search className="size-20 text-gray-400 mx-auto mb-4" />}
              />
            ) : (
              <div className="text-center py-12">
                <Frown className="size-20 text-gray-400 mx-auto mb-4" />

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nema popisa za kupnju
                </h3>

                <p className="text-gray-600 mb-6">
                  Stvorite svoj prvi popis za kupnju i počnite organizirati
                  kupovinu
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
          </>
        )}
      </UserInventoryLayout>
    </>
  );
}
