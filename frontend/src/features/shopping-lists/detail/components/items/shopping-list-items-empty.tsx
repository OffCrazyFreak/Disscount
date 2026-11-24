import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface IShoppingListItemsEmptyProps {
  isOwner: boolean;
}

export default function ShoppingListItemsEmpty({
  isOwner,
}: IShoppingListItemsEmptyProps) {
  const t = useTranslations("shoppingListDetail");

  return (
    <div className="p-4 text-center">
      <p className="mb-4 text-gray-600">
        {isOwner ? t("items.emptyOwner") : t("items.empty")}
      </p>

      {/* Only the owner can add items, so nobody else gets an invitation to try. */}
      {isOwner && (
        <Button asChild effect="shineHover">
          <Link href="/products">
            <Search aria-hidden="true" className="size-5" />
            {t("items.searchProducts")}
          </Link>
        </Button>
      )}
    </div>
  );
}
