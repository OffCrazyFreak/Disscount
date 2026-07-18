"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Search, Plus, ShoppingCart, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import ShoppingListItem from "@/app/(user)/shopping-lists/components/shopping-list-item";
import CreateShoppingListButton from "@/app/(user)/shopping-lists/components/create-shopping-list-button";
import NoResults from "@/components/custom/no-results";
import LoginRequired from "@/components/custom/login-required";
import { filterByFields } from "@/utils/generic";
import { shoppingListService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";

export default function ShoppingListsClient({ query }: { query: string }) {
  const pathname = usePathname();

  const { isAuthenticated, isLoading: userLoading } = useUser();
  const { data: shoppingLists = [], isLoading } =
    shoppingListService.useGetCurrentUserShoppingLists({
      enabled: isAuthenticated,
    });

  const isUserLoading = userLoading || isLoading;

  const matchingShoppingLists = filterByFields(shoppingLists, query, ["title"]);

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title="Popisi za kupnju"
        description="Popisi za kupnju ti omogućuju da organiziraš kupovinu i na jednom mjestu usporediš cijene po trgovinama."
        icon={<ListChecks className="size-12 text-primary" />}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
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
              ? `Rezultati pretrage za "${query}" (${matchingShoppingLists.length})`
              : `Moji popisi za kupnju${
                  isUserLoading ? "" : ` (${matchingShoppingLists.length})`
                }`}
          </h3>

          <CreateShoppingListButton
            onCreateClick={() =>
              openModalUrl({ name: "shopping-list", action: "new" })
            }
          />
        </div>

        {isUserLoading ? (
          <div className="grid place-items-center">
            <BlockLoadingSpinner />
          </div>
        ) : matchingShoppingLists.length > 0 ? (
          <>
            {matchingShoppingLists.map((shoppingList) => (
              <ShoppingListItem
                key={shoppingList.id}
                shoppingList={shoppingList}
              />
            ))}
          </>
        ) : query ? (
          <NoResults
            icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
          />
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nema popisa za kupnju
            </h3>
            <p className="text-gray-600 mb-6">
              Stvorite svoj prvi popis za kupnju…
            </p>
            <Button
              effect="shineHover"
              icon={Plus}
              iconPlacement="left"
              onClick={() =>
                openModalUrl({ name: "shopping-list", action: "new" })
              }
            >
              Stvori popis za kupnju
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
