import { cn } from "@/lib/utils";
import type { INotificationStore } from "@/context/notifications-types";

interface IStorePriceListProps {
  stores: INotificationStore[];
}

export default function StorePriceList({ stores }: IStorePriceListProps) {
  const bestPercentage = stores.length
    ? Math.max(...stores.map((store) => Math.round(store.discountPercentage)))
    : 0;

  return (
    <div className="space-y-0">
      {stores.map((store) => (
        <p
          key={store.chainName}
          className={cn(
            "text-sm",
            Math.round(store.discountPercentage) === bestPercentage &&
              "text-green-700",
          )}
        >
          {store.chainName} ~ {store.currentPrice.toFixed(2)}€
          {` (-${store.discountAmount.toFixed(2)}€, ${Math.round(store.discountPercentage)}%)`}
        </p>
      ))}
    </div>
  );
}
