import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/utils/strings";
import { ShoppingListDto } from "@/lib/api/types";

interface ISelectedListSummaryProps {
  list: ShoppingListDto;
}

export default function SelectedListSummary({
  list,
}: ISelectedListSummaryProps) {
  const t = useTranslations("products");
  const locale = useLocale();

  const checked =
    list.items?.reduce((sum, item) => (item.isChecked ? sum + 1 : sum), 0) ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span className="truncate">{list.title}</span>

      {list.updatedAt && (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {t("listSelector.updatedAt", {
            date: formatDate(list.updatedAt, locale),
          })}
        </span>
      )}

      <span className="ml-auto text-xs text-gray-500">
        {t("listSelector.progress", {
          checked,
          total: list.items?.length ?? 0,
        })}
      </span>
    </div>
  );
}
