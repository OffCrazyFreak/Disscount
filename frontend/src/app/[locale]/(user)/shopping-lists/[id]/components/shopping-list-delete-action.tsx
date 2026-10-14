import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { LOADING_LABELS } from "@/constants/loading-labels";
import ShoppingListIconAction from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-icon-action";

interface IShoppingListDeleteActionProps {
  isDeleting: boolean;
  onDeleteClick: () => void;
}

export default function ShoppingListDeleteAction({
  isDeleting,
  onDeleteClick,
}: IShoppingListDeleteActionProps) {
  const t = useTranslations("shoppingListDetail");
  const tShell = useTranslations("shell");

  // Icon-only, so the spinner is the whole visual and the accessible name carries the
  // pending state. The tooltip has to say the same thing or the two contradict each
  // other. Neither share nor copy has one: both only open something.
  const deleteLabel = isDeleting
    ? tShell(LOADING_LABELS.deleting)
    : t("actions.delete");

  return (
    <ShoppingListIconAction
      label={deleteLabel}
      className="bg-red-600 hover:bg-red-700"
      onClick={() => {
        onDeleteClick();
      }}
      disabled={isDeleting}
      tooltipVariant="destructive"
    >
      {isDeleting ? (
        <BlockLoadingSpinner size={16} className="text-inherit" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
    </ShoppingListIconAction>
  );
}
