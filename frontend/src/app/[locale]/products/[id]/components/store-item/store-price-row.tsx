import { useTranslations } from "next-intl";
import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";
import { StorePrice } from "@/lib/cijene-api/schemas";
import { getLocationLabel } from "@/utils/labels";
import StorePriceCell from "@/app/[locale]/products/[id]/components/store-item/store-price-cell";

interface IStorePriceRowProps {
  price: StorePrice;
  isLocationPreferred: boolean;
  productMinPrice: number | null;
  productMaxPrice: number | null;
}

export default function StorePriceRow({
  price,
  isLocationPreferred,
  productMinPrice,
  productMaxPrice,
}: IStorePriceRowProps) {
  const t = useTranslations("productDetail.pricesTable");

  return (
    <TableRow
      className={cn(
        "text-pretty [&>*]:whitespace-normal",
        isLocationPreferred ? "text-gray-700" : "text-gray-500",
      )}
    >
      <TableCell lang={price.store.city ? "hr" : undefined}>
        {getLocationLabel(price.store.city, t("unknown"))}
      </TableCell>

      <TableCell lang={price.store.address ? "hr" : undefined}>
        <Link
          href={`/map?store=${encodeURIComponent(toStoreKey(price.chain, price.store.code))}`}
          className={cn(
            buttonVariants({
              variant: "ghost",
              effect: "hoverUnderline",
            }),
            "h-auto justify-start gap-1.5 whitespace-normal px-0 py-1 text-left font-normal text-inherit hover:bg-transparent",
          )}
        >
          {price.store.address || t("unknown")}
          <SquareArrowOutUpRight
            className="size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span className="sr-only">{t("showOnMap")}</span>
        </Link>
      </TableCell>

      <TableCell className="text-center">
        <StorePriceCell
          price={price}
          isLocationPreferred={isLocationPreferred}
          productMinPrice={productMinPrice}
          productMaxPrice={productMaxPrice}
        />
      </TableCell>
    </TableRow>
  );
}
