import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import type { IWatchlistNotification } from "@/context/notifications-types";
import NotificationItem from "@/components/custom/notifications/components/notification-item";
import NotificationsEmptyState from "@/components/custom/notifications/components/notifications-empty-state";

interface INotificationsListProps {
  notifications: IWatchlistNotification[];
  isLoading: boolean;
  hasWatchlistItems: boolean;
  onSelect: () => void;
  onAddProducts: () => void;
}

export default function NotificationsList({
  notifications,
  isLoading,
  hasWatchlistItems,
  onSelect,
  onAddProducts,
}: INotificationsListProps) {
  const sortedNotifications = [...notifications].sort((a, b) => {
    const maxDiscountA = Math.max(
      ...a.discountedStores.map((store) => store.discountPercentage),
    );
    const maxDiscountB = Math.max(
      ...b.discountedStores.map((store) => store.discountPercentage),
    );
    return maxDiscountB - maxDiscountA;
  });

  return (
    <div className="max-h-128 overflow-y-auto">
      {isLoading ? (
        <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <BlockLoadingSpinner size={16} />
          <span className="text-sm">Učitavanje...</span>
        </div>
      ) : notifications.length === 0 ? (
        <NotificationsEmptyState
          hasWatchlistItems={hasWatchlistItems}
          onAddProducts={onAddProducts}
        />
      ) : (
        sortedNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}
