import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/strings";

interface IStoreCardBadgesProps {
  hasAllItems: boolean;
  itemCount: number;
  totalItemsInList: number;
  isDataFromToday: boolean;
  priceDate: string;
}

export default function StoreCardBadges({
  hasAllItems,
  itemCount,
  totalItemsInList,
  isDataFromToday,
  priceDate,
}: IStoreCardBadgesProps) {
  return (
    // Badges are nowrap and never shrink, so on narrow screens they stack instead of overflowing.
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
      {!hasAllItems && (
        <Badge variant="warningSoft">
          <TriangleAlert className="size-4 mr-1" />
          Dostupno proizvoda {itemCount}/{totalItemsInList}
        </Badge>
      )}

      {!isDataFromToday && (
        <Badge variant="warningSoft">
          <TriangleAlert className="size-4 mr-1" />
          Podaci od {formatDate(priceDate)}
        </Badge>
      )}
    </div>
  );
}
