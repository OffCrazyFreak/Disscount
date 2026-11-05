"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ShoppingListItemRows, {
  type IShoppingListItemRowsProps,
} from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-item-rows";
import StoreGroupHeader from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/store-group-header";
import { groupItemsByStore } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/group-items-by-store";
import type { ShoppingListItemDto } from "@/lib/api/types";
import {
  getShoppingListGroupByStore,
  setShoppingListGroupByStore,
} from "@/utils/browser/local-storage";
import { compareHr } from "@/utils/strings";

interface IShoppingListItemViewsProps {
  listId: string;
  items: ShoppingListItemDto[];
  /** Until prices arrive no item knows its cheapest chain, so nothing groups yet. */
  isPricesLoading: boolean;
  rowProps: Omit<IShoppingListItemRowsProps, "items">;
}

/** The items A to Z, or split by store, with the switch between the two remembered per list. */
export default function ShoppingListItemViews({
  listId,
  items,
  isPricesLoading,
  rowProps,
}: IShoppingListItemViewsProps) {
  const t = useTranslations("shoppingListDetail");
  const [isGrouped, setIsGrouped] = useState(() =>
    getShoppingListGroupByStore(listId),
  );
  const switchId = `group-by-store-${listId}`;

  function toggleGrouped(grouped: boolean) {
    setIsGrouped(grouped);
    setShoppingListGroupByStore(listId, grouped);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Switch
          id={switchId}
          checked={isGrouped}
          onCheckedChange={toggleGrouped}
        />
        <Label htmlFor={switchId}>{t("groups.toggle")}</Label>
      </div>

      {isGrouped && !isPricesLoading ? (
        groupItemsByStore({
          items,
          cheapestStores: rowProps.cheapestStores,
          storePrices: rowProps.storePrices,
        }).map((group) => (
          <Card key={group.chain ?? "other"} className="p-4">
            <StoreGroupHeader group={group} />
            <ShoppingListItemRows {...rowProps} items={group.items} />
          </Card>
        ))
      ) : (
        <Card className="p-4">
          <ShoppingListItemRows
            {...rowProps}
            items={[...items].sort((a, b) => compareHr(a.name, b.name))}
          />
        </Card>
      )}
    </div>
  );
}
