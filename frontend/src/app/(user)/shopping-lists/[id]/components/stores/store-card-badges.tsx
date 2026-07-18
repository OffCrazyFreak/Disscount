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
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 border-orange-200"
        >
          <TriangleAlert className="size-4 mr-1" />
          Dostupno proizvoda {itemCount}/{totalItemsInList}
        </Badge>
      )}

      {!isDataFromToday && (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 border-amber-200"
        >
          <TriangleAlert className="size-4 mr-1" />
          Podaci od {formatDate(priceDate)}
        </Badge>
      )}
    </div>
  );
}
