import AsyncSection from "@/components/custom/common/async-section";
import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import NotificationItemSkeleton from "@/components/custom/notifications/components/notification-item-skeleton";
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
      <AsyncSection
        pending={isLoading}
        isEmpty={notifications.length === 0}
        empty={
          <NotificationsEmptyState
            hasWatchlistItems={hasWatchlistItems}
            onAddProducts={onAddProducts}
          />
        }
        skeleton={
          <RepeatSkeleton count={3}>
            <NotificationItemSkeleton />
          </RepeatSkeleton>
        }
      >
        {sortedNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onSelect={onSelect}
          />
        ))}
      </AsyncSection>
    </div>
  );
}
