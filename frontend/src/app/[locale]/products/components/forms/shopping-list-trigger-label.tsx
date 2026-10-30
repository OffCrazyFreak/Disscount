import { useTranslations } from "next-intl";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import SelectedListSummary from "@/app/[locale]/products/components/forms/selected-list-summary";
import { ShoppingListDto } from "@/lib/api/types";

interface IShoppingListTriggerLabelProps {
  isLoadingLists: boolean;
  hasShoppingLists: boolean;
  isNewList: boolean;
  customListTitle: string;
  selectedList: ShoppingListDto | undefined;
}

export default function ShoppingListTriggerLabel({
  isLoadingLists,
  hasShoppingLists,
  isNewList,
  customListTitle,
  selectedList,
}: IShoppingListTriggerLabelProps) {
  const t = useTranslations("products");

  if (isLoadingLists) {
    return (
      <div>
        <BlockLoadingSpinner size={20} />
        <span className="sr-only">{t("listTrigger.loading")}</span>
      </div>
    );
  }

  if (isNewList && customListTitle.trim()) {
    return (
      <div className="truncate">
        {t("listTrigger.createNamed", { title: customListTitle.trim() })}
      </div>
    );
  }

  if (selectedList) return <SelectedListSummary list={selectedList} />;

  return hasShoppingLists
    ? t("listTrigger.choose")
    : t("listTrigger.createFirst");
}
