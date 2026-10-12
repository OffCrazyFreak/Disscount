import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

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
import { getChainItemPriceInfo } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/shopping-list-items-table-utils";
import { productPath } from "@/utils/product-links";
import { formatPrice } from "@/utils/price";

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
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();

  const { isAvailable, price, quantity, total, isLowestPrice, isHighestPrice } =
    getChainItemPriceInfo(item, productsData, chain);

  return (
    <TableRow className={cn("text-pretty [&>*]:whitespace-normal")}>
      <TableCell>
        <Link
          href={productPath(item.ean)}
          className={cn(
            "hover:underline hover:text-primary cursor-pointer",
            !isAvailable && "text-gray-400",
            item.isChecked && "line-through text-gray-700",
          )}
        >
          <span lang="hr">{item.name}</span>
        </Link>

        {!isAvailable && (
          <Tooltip>
            <TooltipTrigger asChild>
              {isMobile ? (
                <TriangleAlert className="size-4 shrink-0 text-amber-600 inline ml-2" />
              ) : (
                <Badge variant="warningSoft">
                  <TriangleAlert className="size-4 shrink-0" />
                  {t("stores.table.unavailable")}
                </Badge>
              )}
            </TooltipTrigger>

            <TooltipContent variant="warningSoft" className="px-2 py-1 text-xs">
              {t("stores.table.unavailableTooltip")}
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
            {formatPrice(price, locale)}
            {isLowestPrice && (
              <>
                <ArrowBigDownDash className="size-5" aria-hidden="true" />
                <span className="sr-only">{t("stores.table.lowestPrice")}</span>
              </>
            )}
            {isHighestPrice && (
              <>
                <ArrowBigUpDash className="size-5" aria-hidden="true" />
                <span className="sr-only">
                  {t("stores.table.highestPrice")}
                </span>
              </>
            )}
          </span>
        ) : (
          <span className="text-gray-400">{t("emptyValue")}</span>
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
                  : "font-medium text-foreground",
            )}
          >
            {formatPrice(total, locale)}
          </span>
        ) : (
          <span className="text-gray-400">{t("emptyValue")}</span>
        )}
      </TableCell>
    </TableRow>
  );
}
