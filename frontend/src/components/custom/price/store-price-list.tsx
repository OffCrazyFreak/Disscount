import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/price";
import type { INotificationStore } from "@/context/notifications-types";

interface IStorePriceListProps {
  stores: INotificationStore[];
}

export default function StorePriceList({ stores }: IStorePriceListProps) {
  const t = useTranslations("products");
  const locale = useLocale();
  const bestPercentage = stores.length
    ? Math.max(...stores.map((store) => Math.round(store.discountPercentage)))
    : 0;

  function storeLine(store: INotificationStore) {
    return t.rich("storePrice.line", {
      chain: store.chainName,
      price: formatPrice(store.currentPrice, locale),
      discount: formatPrice(store.discountAmount, locale),
      percentage: Math.round(store.discountPercentage),
      chainName: (chunks) => <span lang="hr">{chunks}</span>,
    });
  }

  return (
    <div className="space-y-0">
      {stores.map((store) => (
        <p
          key={store.chainName}
          className={cn(
            "text-sm",
            Math.round(store.discountPercentage) === bestPercentage &&
              "text-primary",
          )}
        >
          {storeLine(store)}
        </p>
      ))}
    </div>
  );
}
