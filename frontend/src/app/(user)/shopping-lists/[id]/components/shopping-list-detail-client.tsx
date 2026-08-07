"use client";

import AsyncSection from "@/components/custom/common/async-section";
import ShoppingListStoreSummary from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list";
import ShoppingListHeader from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header";
import ShoppingListItems from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import ShoppingListPriceHistory from "@/app/(user)/shopping-lists/[id]/components/shopping-list-price-history";
import ShoppingListInfoTable from "@/app/(user)/shopping-lists/[id]/components/shopping-list-info-table";
import ShoppingListAccessBanner from "@/app/(user)/shopping-lists/[id]/components/shopping-list-access-banner";
import ShoppingListUnavailable from "@/app/(user)/shopping-lists/[id]/components/shopping-list-unavailable";
import ShoppingListDetailSkeleton from "@/app/(user)/shopping-lists/[id]/components/shopping-list-detail-skeleton";
import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import { useUser } from "@/context/user-context";
import { useShoppingListData } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";
import {
  useRememberedRowCount,
  useRememberRowCount,
} from "@/hooks/use-remembered-row-count";

interface IShoppingListDetailClientProps {
  listId: string;
}

/**
 * One page for the owner and for anyone holding the link. The list id is the shareable
 * URL, so this route is reachable signed out and nothing here may assume ownership: every
 * control is gated on the access the server resolved into myAccess.
 */
export default function ShoppingListDetailClient({
  listId,
}: IShoppingListDetailClientProps) {
  const { isAuthenticated } = useUser();

  const {
    shoppingList,
    isLoading,
    error,
    refetch,
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

  return (
    <AsyncSection
      pending={isLoading}
      // A settled fetch with no list means it is gone or was never yours to see. The
      // server answers not-found rather than forbidden, so those are one dead end here.
      error={error ?? (shoppingList ? undefined : new Error("Nije pronađeno"))}
      errorState={
        <ShoppingListUnavailable
          error={error}
          onRetry={() => void refetch()}
          isSignedIn={isAuthenticated}
        />
      }
      skeleton={<ShoppingListDetailSkeleton itemRows={itemRows} />}
    >
      {shoppingList && (
        <div className="space-y-8">
          {/* Unconditional: it falls silent for an owner on its own, and the disabled item
              controls point at its id with aria-describedby, so gating it here would leave
              that IDREF dangling for exactly the people who need the explanation. */}
          <ShoppingListAccessBanner
            myAccess={shoppingList.myAccess}
            isSignedIn={isAuthenticated}
          />

          <section>
            <ShoppingListHeader
              shoppingList={shoppingList}
              isSignedIn={isAuthenticated}
            />

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
            {/* Last on the page on purpose. This section issues one request per item
                per day, so a ten-item list on the default period is seventy requests;
                starting them before the items' own prices land would starve the page. */}
            <ShoppingListPriceHistory
              shoppingList={shoppingList}
              enabled={!isPricesLoading}
            />
          </section>

          <section>
            <ShoppingListStoreSummary shoppingList={shoppingList} />
          </section>
        </div>
      )}
    </AsyncSection>
  );
}
