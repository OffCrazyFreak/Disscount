import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { getChainItemPriceInfo } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/shopping-list-items-table-utils";
import { priceTone } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-tone";
import UnavailableItemBadge from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/unavailable-item-badge";
import ChainItemUnitPrice from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/chain-item-unit-price";
import { productPath } from "@/utils/product-links";
import { formatPrice } from "@/utils/price";

const TOTAL_PRICE_TONES = {
  low: "font-medium text-green-600",
  high: "font-medium text-red-700",
  neutral: "font-medium text-foreground",
};

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

        {!isAvailable && <UnavailableItemBadge isMobile={isMobile} />}
      </TableCell>

      <TableCell className={cn("text-center", !isAvailable && "text-gray-400")}>
        {quantity}
      </TableCell>

      <TableCell className={cn("text-center", !isAvailable && "text-gray-400")}>
        {isAvailable ? (
          <ChainItemUnitPrice
            price={price}
            isLowestPrice={isLowestPrice}
            isHighestPrice={isHighestPrice}
          />
        ) : (
          <span className="text-gray-400">{t("emptyValue")}</span>
        )}
      </TableCell>

      <TableCell className="text-center">
        {isAvailable ? (
          <span
            className={cn(
              "flex items-center justify-center gap-1",
              priceTone(TOTAL_PRICE_TONES, isLowestPrice, isHighestPrice),
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
