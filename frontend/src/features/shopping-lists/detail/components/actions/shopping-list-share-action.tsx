import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";

import Share2Pen from "@/components/custom/icons/share-2-pen";
import ShoppingListIconAction from "@/features/shopping-lists/detail/components/actions/shopping-list-icon-action";

interface IShoppingListShareActionProps {
  isShared: boolean;
  onShare: () => void;
}

export default function ShoppingListShareAction({
  isShared,
  onShare,
}: IShoppingListShareActionProps) {
  const t = useTranslations("shoppingListDetail");
  const shareLabel = isShared ? t("actions.editShare") : t("actions.share");

  return (
    <ShoppingListIconAction label={shareLabel} onClick={() => onShare()}>
      {isShared ? (
        <Share2Pen aria-hidden="true" />
      ) : (
        <Share2 aria-hidden="true" />
      )}
    </ShoppingListIconAction>
  );
}
