"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import ShoppingListStoreSummary from "./stores/shopping-list-stores-list";
import ShoppingListHeader from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header";
import ShoppingListItems from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import ShoppingListPriceHistory from "@/app/(user)/shopping-lists/[id]/components/shopping-list-price-history";
import ShoppingListInfoTable from "@/app/(user)/shopping-lists/[id]/components/shopping-list-info-table";
import { useShoppingListData } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";

interface ShoppingListDetailClientProps {
  listId: string;
}

export default function ShoppingListDetailClient({
  listId,
}: ShoppingListDetailClientProps) {
  // Use custom hooks for data and mutations
  const {
    shoppingList,
    isLoading,
    error,
    cheapestStores,
    averagePrices,
    storePrices,
    isPricesLoading,
  } = useShoppingListData(listId);

  if (isLoading) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner size={96} />
      </div>
    );
  }

  if (error || !shoppingList) {
    return (
      <div className="mx-auto">
        <div className="text-center py-12">
          <div className="text-red-700 mb-4">
            <h3 className="text-lg font-semibold mb-2">Greška</h3>
            <p>Popis za kupnju nije pronađen ili se dogodila greška.</p>
          </div>

          <Link href="/shopping-lists">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Natrag na popise za kupnju
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section>
        <ShoppingListHeader shoppingList={shoppingList} />
      </section>

      {/* Info Display Section */}
      <section>
        <ShoppingListInfoTable
          shoppingList={shoppingList}
          averagePrices={averagePrices}
          isPricesLoading={isPricesLoading}
        />
      </section>

      {/* Shopping List Items Section */}
      <section>
        <ShoppingListItems
          shoppingList={shoppingList}
          cheapestStores={cheapestStores}
          averagePrices={averagePrices}
          storePrices={storePrices}
        />
      </section>

      {/* Price History Section */}
      <section>
        <ShoppingListPriceHistory shoppingList={shoppingList} />
      </section>

      {/* Store Summary Section */}
      <section>
        <ShoppingListStoreSummary shoppingList={shoppingList} />
      </section>
    </div>
  );
}
