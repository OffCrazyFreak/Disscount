"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, ShoppingCart, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ShoppingListItem from "@/app/(user)/shopping-lists/components/shopping-list-item";
import ShoppingListItemSkeleton from "@/app/(user)/shopping-lists/components/shopping-list-item-skeleton";
import CreateShoppingListButton from "@/app/(user)/shopping-lists/components/create-shopping-list-button";
import AsyncSection from "@/components/custom/common/async-section";
import CountSkeleton from "@/components/custom/skeleton/count-skeleton";
import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import NoResults from "@/components/custom/common/no-results";
import LoginRequired from "@/components/custom/common/login-required";
import { filterByFields } from "@/utils/generic";
import { shoppingListQueries } from "@/lib/api/shopping-lists/hooks";
import { useAuthedQuery } from "@/lib/query/use-authed-query";
import {
  useRememberedRowCount,
  useRememberRowCount,
} from "@/hooks/use-remembered-row-count";
import { openModalUrl } from "@/lib/modal/modal-navigation";

const ROW_COUNT_KEY = "shoppingLists:me";

interface IShoppingListsClientProps {
  query: string;
}

export default function ShoppingListsClient({
  query,
}: IShoppingListsClientProps) {
  const pathname = usePathname();

  const {
    data: shoppingLists = [],
    pending: isUserLoading,
    error,
    requiresAuth,
  } = useAuthedQuery(shoppingListQueries.me());

  const matchingShoppingLists = filterByFields(shoppingLists, query, ["title"]);

  const rows = useRememberedRowCount(ROW_COUNT_KEY, 3);
  useRememberRowCount(ROW_COUNT_KEY, shoppingLists.length);

  if (requiresAuth) {
    return (
      <LoginRequired
        title="Popisi za kupnju"
        description="Popisi za kupnju ti omogućuju da organiziraš kupovinu i na jednom mjestu usporediš cijene po trgovinama."
        icon={<ListChecks className="size-12 text-primary" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder="Pretraži popise za kupnju..."
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
          disabled={!isUserLoading && shoppingLists.length === 0}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        {/* The count is a placeholder pill until it is known, so the heading
            never paints a 0 it then has to correct. */}
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" `
            : "Moji popisi za kupnju "}

          {isUserLoading ? (
            <CountSkeleton />
          ) : (
            `(${matchingShoppingLists.length})`
          )}
        </h3>

        <CreateShoppingListButton
          onCreateClick={() =>
            openModalUrl({ name: "shopping-list", action: "new" })
          }
        />
      </div>

      <AsyncSection
        pending={isUserLoading}
        error={error}
        isEmpty={matchingShoppingLists.length === 0}
        skeleton={
          <RepeatSkeleton className="space-y-4" count={rows}>
            <ShoppingListItemSkeleton />
          </RepeatSkeleton>
        }
        empty={
          query ? (
            <NoResults
              icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
            />
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nema popisa za kupnju
              </h3>
              <p className="text-gray-600 mb-6">
                Stvori popis za kupnju ili pretraži proizvode i dodaj ih na novi
                popis.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
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

                <Button asChild variant="outline">
                  <Link href="/products">
                    <Search aria-hidden="true" className="size-5" />
                    Pretraži proizvode
                  </Link>
                </Button>
              </div>
            </div>
          )
        }
      >
        {matchingShoppingLists.map((shoppingList) => (
          <ShoppingListItem key={shoppingList.id} shoppingList={shoppingList} />
        ))}
      </AsyncSection>
    </div>
  );
}
