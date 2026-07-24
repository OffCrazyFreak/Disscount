import Link from "next/link";
import type { IWatchlistNotification } from "@/context/notifications-types";
import StorePriceList from "@/components/custom/price/store-price-list";
import { formatQuantity } from "@/utils/strings";

interface INotificationItemProps {
  notification: IWatchlistNotification;
  onSelect: () => void;
}

export default function NotificationItem({
  notification,
  onSelect,
}: INotificationItemProps) {
  const formattedQuantity = formatQuantity(notification.productQuantity);

  const quantityWithUnit =
    formattedQuantity && notification.productUnit
      ? `${formattedQuantity}${notification.productUnit}`
      : null;

  return (
    <Link
      href={`/products/${notification.productApiId}`}
      onClick={onSelect}
      className="block p-4 border-b last:border-b-0 hover:bg-primary/5 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div>
            <h4 className="text-sm text-pretty hover:text-primary transition-colors text-foreground">
              {notification.productName}
              {quantityWithUnit ? ` (${quantityWithUnit})` : ""}
            </h4>

            {notification.productBrand && (
              <p className="text-xs text-gray-600 text-pretty">
                {notification.productBrand}
              </p>
            )}
          </div>

          <StorePriceList stores={notification.discountedStores} />
        </div>
      </div>
    </Link>
  );
}
