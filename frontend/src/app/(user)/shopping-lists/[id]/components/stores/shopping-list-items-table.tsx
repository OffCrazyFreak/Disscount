"use client";

import { memo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingListDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { sortShoppingListItemsByPurchaseAndSaving } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ShoppingListItemRow from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-item-row";

interface IShoppingListItemsTableProps {
  chain: ChainProductResponse;
  shoppingList: ShoppingListDto;
  productsData: ProductResponse[];
}

const ShoppingListItemsTable = memo(
  ({ chain, shoppingList, productsData }: IShoppingListItemsTableProps) => {
    const isMobile = useIsMobile();

    if (!shoppingList.items || shoppingList.items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nema stavki na popisu za kupnju
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Proizvod</TableHead>
              <TableHead className="font-bold text-center">Količina</TableHead>
              <TableHead className="font-bold text-center">Cijena</TableHead>
              <TableHead className="font-bold text-center">Ukupno</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...shoppingList.items]
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
      </div>
    );
  },
);

ShoppingListItemsTable.displayName = "ShoppingListItemsTable";

export default ShoppingListItemsTable;
