import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface INotificationsEmptyStateProps {
  hasWatchlistItems: boolean;
  onAddProducts: () => void;
}

export default function NotificationsEmptyState({
  hasWatchlistItems,
  onAddProducts,
}: INotificationsEmptyStateProps) {
  const t = useTranslations("common");

  return (
    <div className="p-2 space-y-4 text-center">
      <p className="text-sm text-muted-foreground text-pretty">
        {hasWatchlistItems
          ? t("notifications.emptyWatching")
          : t("notifications.emptyNotWatching")}
      </p>

      {!hasWatchlistItems && (
        <Button
          effect="shineHover"
          size={"default"}
          icon={Eye}
          iconPlacement="left"
          onClick={onAddProducts}
        >
          {t("notifications.addProducts")}
        </Button>
      )}
    </div>
  );
}
