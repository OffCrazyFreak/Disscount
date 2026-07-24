import { cn } from "@/lib/utils";
import type { INotificationStore } from "@/context/notifications-types";

interface IStorePriceListProps {
  stores: INotificationStore[];
}

export default function StorePriceList({ stores }: IStorePriceListProps) {
  return (
    <div className="space-y-0">
      {stores.map((store) => (
        <p
          key={store.chainName}
          className={cn("text-sm", store.meetsThreshold && "text-green-700")}
        >
          {store.chainName} ~ {store.currentPrice.toFixed(2)}€
          {` (-${store.discountAmount.toFixed(2)}€, ${Math.round(store.discountPercentage)}%)`}
        </p>
      ))}
    </div>
  );
}
