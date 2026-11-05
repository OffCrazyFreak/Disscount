"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ScrollFadeArea from "@/components/custom/common/scroll-fade-area";
import { ShoppingListDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { sortShoppingListItemsByPurchaseAndSaving } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ShoppingListItemRow from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-item-row";
import { isCatalogItem } from "@/app/[locale]/(user)/shopping-lists/utils/catalog-items";

interface IShoppingListItemsTableProps {
  chain: ChainProductResponse;
  shoppingList: ShoppingListDto;
  productsData: ProductResponse[];
}

const ShoppingListItemsTable = memo(
  ({ chain, shoppingList, productsData }: IShoppingListItemsTableProps) => {
    const t = useTranslations("shoppingListDetail");
    const isMobile = useIsMobile();

    // Plain items have no prices at any store, so a store's table leaves them out.
    const catalogItems = (shoppingList.items ?? []).filter(isCatalogItem);

    if (catalogItems.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {t("stores.table.empty")}
        </div>
      );
    }

    return (
      <ScrollFadeArea className="max-h-96" fadeClassName="from-card h-12">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">
                {t("stores.table.product")}
              </TableHead>
              <TableHead className="font-bold text-center">
                {t("stores.table.quantity")}
              </TableHead>
              <TableHead className="font-bold text-center">
                {t("stores.table.price")}
              </TableHead>
              <TableHead className="font-bold text-center">
                {t("stores.table.total")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogItems
              .sort((a, b) =>
                sortShoppingListItemsByPurchaseAndSaving(
                  a,
                  b,
                  productsData,
                  chain,
                ),
              )
              .map((item) => (
                <ShoppingListItemRow
                  key={item.id}
                  item={item}
                  chain={chain}
                  productsData={productsData}
                  isMobile={isMobile}
                />
              ))}
          </TableBody>
        </Table>
      </ScrollFadeArea>
    );
  },
);

ShoppingListItemsTable.displayName = "ShoppingListItemsTable";

export default ShoppingListItemsTable;
