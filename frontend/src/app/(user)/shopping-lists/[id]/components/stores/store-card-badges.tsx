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
    <div className="flex items-center gap-3">
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
