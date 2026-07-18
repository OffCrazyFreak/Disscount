"use client";

import { memo, useState, useCallback } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingListDto } from "@/lib/api/types";
import { useUser } from "@/context/user-context";
import ShoppingListItemsTable from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-items-table";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import {
  ChainSummary,
  ICompleteStoresAnalysis,
} from "@/app/(user)/shopping-lists/[id]/components/stores/store-chain-types";
import { getStoreCardMetrics } from "@/app/(user)/shopping-lists/[id]/components/stores/store-card-utils";
import StoreCardHeader from "@/app/(user)/shopping-lists/[id]/components/stores/store-card-header";

interface IShoppingListStoreItemProps {
  chain: ChainSummary;
  shoppingList: ShoppingListDto;
  absoluteMinPrice: number;
  absoluteMaxPrice: number;
  productsData: ProductResponse[];
  completeStoresAnalysis: ICompleteStoresAnalysis;
  hasLowestPriceItem: boolean;
  hasHighestPriceItem: boolean;
}

function ShoppingListStoreItemComponent({
  chain,
  shoppingList,
  absoluteMinPrice,
  absoluteMaxPrice,
  productsData,
  completeStoresAnalysis,
  hasLowestPriceItem,
  hasHighestPriceItem,
}: IShoppingListStoreItemProps) {
  const { user } = useUser();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const toggleStoreExpansion = useCallback((chainCode: string) => {
    setExpandedStore((prev: string | null) =>
      prev === chainCode ? null : chainCode,
    );
  }, []);

  const metrics = getStoreCardMetrics({
    chain,
    shoppingList,
    absoluteMinPrice,
    absoluteMaxPrice,
    pinnedStores: user?.pinnedStores,
  });

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow py-0">
      <Collapsible
        open={expandedStore === chain.chain}
        onOpenChange={() => toggleStoreExpansion(chain.chain)}
      >
        <CollapsibleTrigger asChild className="cursor-pointer">
          <button type="button" className="w-full text-left">
            <StoreCardHeader
              chain={chain}
              metrics={metrics}
              pinnedStoresCount={user?.pinnedStores?.length ?? 0}
              hasLowestPriceItem={hasLowestPriceItem}
              hasHighestPriceItem={hasHighestPriceItem}
              isExpanded={expandedStore === chain.chain}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ShoppingListItemsTable
              chain={chain}
              shoppingList={shoppingList}
              productsData={productsData}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

ShoppingListStoreItemComponent.displayName = "ShoppingListStoreItem";
const ShoppingListStoreItem = memo(ShoppingListStoreItemComponent);

export default ShoppingListStoreItem;
