"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import { useUser } from "@/context/user-context";
import SharedListAccessBanner from "@/app/s/[token]/components/shared-list-access-banner";
import SharedListUnavailable from "@/app/s/[token]/components/shared-list-unavailable";
import ShoppingListHeader from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header";
import ShoppingListInfoTable from "@/app/(user)/shopping-lists/[id]/components/shopping-list-info-table";
import ShoppingListItems from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import ShoppingListPriceHistory from "@/app/(user)/shopping-lists/[id]/components/shopping-list-price-history";
import ShoppingListStoreSummary from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list";
import { useShoppingListData } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";
import { shoppingListPath } from "@/utils/shopping-list-links";

interface ISharedShoppingListClientProps {
  token: string;
}

export default function SharedShoppingListClient({
  token,
}: ISharedShoppingListClientProps) {
  const router = useRouter();
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
  } = useShoppingListData("", token);

  // The owner following their own link belongs on the real list, where sharing, editing
  // and deleting live. Replace rather than push, so Back does not bounce them here again.
  const isOwner = shoppingList?.myAccess === "OWNER";
  useEffect(() => {
    if (isOwner && shoppingList) {
      router.replace(shoppingListPath(shoppingList.id));
    }
  }, [isOwner, shoppingList, router]);

  if (isLoading || isOwner) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner size={96} />
      </div>
    );
  }

  if (error || !shoppingList) {
    return (
      <SharedListUnavailable error={error} onRetry={() => void refetch()} />
    );
  }

  return (
    <div className="space-y-8">
      {/* Unconditional: the disabled controls point at this with aria-describedby, and
          gating it on the user context left a window where that IDREF dangled. */}
      <SharedListAccessBanner
        myAccess={shoppingList.myAccess}
        isSignedIn={isAuthenticated}
      />

      <section>
        <ShoppingListHeader
          shoppingList={shoppingList}
          isSignedIn={isAuthenticated}
          shareToken={token}
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
          shareToken={token}
        />
      </section>

      <section>
        <ShoppingListPriceHistory shoppingList={shoppingList} />
      </section>

      <section>
        <ShoppingListStoreSummary shoppingList={shoppingList} />
      </section>
    </div>
  );
}
