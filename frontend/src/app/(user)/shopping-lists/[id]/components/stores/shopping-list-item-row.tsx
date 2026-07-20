import Link from "next/link";
import { ArrowBigUpDash, ArrowBigDownDash, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { getChainItemPriceInfo } from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-items-table-utils";

interface IShoppingListItemRowProps {
  item: ShoppingListItemDto;
  chain: ChainProductResponse;
  productsData: ProductResponse[];
  isMobile: boolean;
}

export default function ShoppingListItemRow({
  item,
  chain,
  productsData,
  isMobile,
}: IShoppingListItemRowProps) {
  const { isAvailable, price, quantity, total, isLowestPrice, isHighestPrice } =
    getChainItemPriceInfo(item, productsData, chain);

  return (
    <TableRow className={cn("text-pretty [&>*]:whitespace-normal")}>
      <TableCell>
        <Link
          href={`/products/${item.ean}`}
          className={cn(
            "hover:underline hover:text-primary cursor-pointer",
            !isAvailable && "text-gray-400",
            item.isChecked && "line-through text-gray-700",
          )}
        >
          {item.name}
        </Link>

        {!isAvailable && (
          <Tooltip>
            <TooltipTrigger asChild>
              {isMobile ? (
                <TriangleAlert className="size-4 shrink-0 text-amber-600 inline ml-2" />
              ) : (
                <Badge variant="primary">
                  <TriangleAlert className="size-4 shrink-0" />
                  Proizvod nedostupan
                </Badge>
              )}
            </TooltipTrigger>

            <TooltipContent variant="warningSoft" className="px-2 py-1 text-xs">
              Proizvod nije dostupan u ovoj trgovini
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>

      <TableCell className={cn("text-center", !isAvailable && "text-gray-400")}>
        {quantity}
      </TableCell>

      <TableCell className={cn("text-center", !isAvailable && "text-gray-400")}>
        {isAvailable ? (
          <span
            className={cn(
              "flex items-start justify-center gap-1",
              isLowestPrice
                ? "text-green-600 font-bold"
                : isHighestPrice
                  ? "text-red-700 font-bold"
                  : "text-gray-700",
            )}
          >
            {price.toFixed(2)}€
            {isLowestPrice && (
              <>
                <ArrowBigDownDash className="size-5" aria-hidden="true" />
                <span className="sr-only">najniža cijena</span>
              </>
            )}
            {isHighestPrice && (
              <>
                <ArrowBigUpDash className="size-5" aria-hidden="true" />
                <span className="sr-only">najviša cijena</span>
              </>
            )}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>

      <TableCell className="text-center">
        {isAvailable ? (
          <span
            className={cn(
              "flex items-center justify-center gap-1",
              isLowestPrice
                ? "font-medium text-green-600"
                : isHighestPrice
                  ? "font-medium text-red-700"
                  : "font-medium text-gray-900",
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
}
