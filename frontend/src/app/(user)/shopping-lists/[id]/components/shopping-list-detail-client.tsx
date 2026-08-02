"use client";

import { ArrowLeft, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AsyncSection from "@/components/custom/common/async-section";
import ErrorState from "@/components/custom/common/error-state";
import LoginRequired from "@/components/custom/common/login-required";
import ShoppingListStoreSummary from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list";
import ShoppingListHeader from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header";
import ShoppingListItems from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import ShoppingListPriceHistory from "@/app/(user)/shopping-lists/[id]/components/shopping-list-price-history";
import ShoppingListInfoTable from "@/app/(user)/shopping-lists/[id]/components/shopping-list-info-table";
import ShoppingListDetailSkeleton from "@/app/(user)/shopping-lists/[id]/components/shopping-list-detail-skeleton";
import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import { useShoppingListData } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";
import {
  useRememberedRowCount,
  useRememberRowCount,
} from "@/hooks/use-remembered-row-count";

interface IShoppingListDetailClientProps {
  listId: string;
}

export default function ShoppingListDetailClient({
  listId,
}: IShoppingListDetailClientProps) {
  const {
    shoppingList,
    isLoading,
    error,
    requiresAuth,
    listUpdatedAt,
    cheapestStores,
    averagePrices,
    storePrices,
    isPricesLoading,
  } = useShoppingListData(listId);

  // Reserves close to the real height on a cold load, instead of a generic four
  // rows that then jumps once the list arrives.
  const rowCountKey = `shoppingList:${listId}`;
  const itemRows = useRememberedRowCount(rowCountKey, 4);
  useRememberRowCount(rowCountKey, shoppingList?.items?.length);

  if (requiresAuth) {
    return (
      <LoginRequired
        title="Popis za kupnju"
        description="Popisi za kupnju ti omogućuju da organiziraš kupovinu i na jednom mjestu usporediš cijene po trgovinama."
        icon={<ListChecks className="size-12 text-primary" />}
      />
    );
  }

  return (
    <AsyncSection
      pending={isLoading}
      // A settled fetch with no list means it is gone or not yours. Different
      // cause from a thrown error, same dead end, so they share a way back.
      error={error ?? (shoppingList ? undefined : new Error("Nije pronađeno"))}
      errorState={
        <ErrorState
          title="Popis nije pronađen"
          fallbackMessage="Popis za kupnju ne postoji ili mu nemaš pristup."
          action={
            <Button asChild variant="ghost">
              <Link href="/shopping-lists">
                <ArrowLeft aria-hidden="true" className="h-4 w-4 mr-2" />
                Natrag na popise za kupnju
              </Link>
            </Button>
          }
        />
      }
      skeleton={<ShoppingListDetailSkeleton itemRows={itemRows} />}
    >
      {shoppingList && (
        <div className="space-y-8">
          <section>
            <ShoppingListHeader shoppingList={shoppingList} />

            {listUpdatedAt > 0 && (
              <LastSyncedLabel
                updatedAt={listUpdatedAt}
                prefix="Popis osvježen"
                className="mt-1 block"
              />
            )}
          </section>

          <section>
            <ShoppingListInfoTable
              shoppingList={shoppingList}
              averagePrices={averagePrices}
              isPricesLoading={isPricesLoading}
            />
          </section>

          <section>
            <ShoppingListItems
              shoppingList={shoppingList}
              cheapestStores={cheapestStores}
              averagePrices={averagePrices}
              storePrices={storePrices}
            />
          </section>

          <section>
            <ShoppingListPriceHistory shoppingList={shoppingList} />
          </section>

          <section>
            <ShoppingListStoreSummary shoppingList={shoppingList} />
          </section>
        </div>
      )}
    </AsyncSection>
  );
}
