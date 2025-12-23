"use client";

import React, { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ShoppingListDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";

interface ShoppingListItemsTableProps {
  chain: ChainProductResponse & { itemCount: number };
  shoppingList: ShoppingListDto;
  productsData: ProductResponse[];
}

export const ShoppingListItemsTable = memo(
  ({ chain, shoppingList, productsData }: ShoppingListItemsTableProps) => {
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
              .sort((a, b) => {
                // Find product data for both items
                const productA = productsData.find((p) => p?.ean === a.ean);
                const productB = productsData.find((p) => p?.ean === b.ean);

                // Find chain data for both items
                const chainDataA = productA?.chains?.find(
                  (c: any) => c.chain === chain.chain
                );
                const chainDataB = productB?.chains?.find(
                  (c: any) => c.chain === chain.chain
                );

                // Check availability
                const isAvailableA = Boolean(chainDataA);
                const isAvailableB = Boolean(chainDataB);

                // Available items come first
                if (isAvailableA && !isAvailableB) return -1;
                if (!isAvailableA && isAvailableB) return 1;

                // Within each group, sort alphabetically
                return a.name.localeCompare(b.name, "hr", {
                  sensitivity: "base",
                });
              })
              .map((item) => {
                // Find the product data for this item
                const product = productsData.find((p) => p?.ean === item.ean);

                // Find the chain data for this product
                const chainData = product?.chains?.find(
                  (c: any) => c.chain === chain.chain
                );

                // Check if item is available in this chain
                const isAvailable = Boolean(chainData);

                // Get the price (prefer special_price, then regular_price)
                const price = chainData ? parseFloat(chainData.avg_price) : 0;
                const quantity = item.amount || 1;
                const total = price * quantity;

                // Find the minimum price for this item across all chains
                const allChainPrices =
                  product?.chains
                    ?.map((c: any) => parseFloat(c.avg_price))
                    .filter((p) => !isNaN(p)) || [];
                const minPriceAcrossChains =
                  allChainPrices.length > 0 ? Math.min(...allChainPrices) : 0;
                const maxPriceAcrossChains =
                  allChainPrices.length > 0 ? Math.max(...allChainPrices) : 0;
                const isLowestPrice =
                  isAvailable &&
                  price === minPriceAcrossChains &&
                  allChainPrices.length > 1;
                const isHighestPrice =
                  isAvailable &&
                  price === maxPriceAcrossChains &&
                  allChainPrices.length > 1;

                return (
                  <TableRow
                    key={item.id}
                    className={cn("text-pretty [&>*]:whitespace-normal")}
                  >
                    <TableCell>
                      <p className={cn(!isAvailable && "text-gray-400")}>
                        {item.name}
                      </p>
                    </TableCell>

                    <TableCell
                      className={cn(
                        "text-center",
                        !isAvailable && "text-gray-400"
                      )}
                    >
                      {quantity}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "text-center",
                        !isAvailable && "text-gray-400"
                      )}
                    >
                      {isAvailable ? (
                        <span
                          className={cn(
                            isLowestPrice
                              ? "text-green-600 font-bold"
                              : isHighestPrice
                                ? "text-red-700 font-bold"
                                : "text-gray-700"
                          )}
                        >
                          {price.toFixed(2)}€
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {isAvailable ? (
                        <span
                          className={cn(
                            isLowestPrice
                              ? "font-medium text-green-600"
                              : isHighestPrice
                                ? "font-medium text-red-700"
                                : "font-medium text-gray-900"
                          )}
                        >
                          {total.toFixed(2)}€
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    );
  }
);

ShoppingListItemsTable.displayName = "ShoppingListItemsTable";
