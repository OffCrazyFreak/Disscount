import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Search, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

export default function ShoppingListsEmptyState() {
  const t = useTranslations("shoppingLists");

  return (
    <div className="text-center py-12">
      <ShoppingCart className="size-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t("client.empty.title")}
      </h3>
      <p className="text-gray-600 mb-6">{t("client.empty.description")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          effect="shineHover"
          icon={Plus}
          iconPlacement="left"
          onClick={() => openModalUrl({ name: "shopping-list", action: "new" })}
        >
          {t("createList.full")}
        </Button>

        <Button asChild variant="outline">
          <Link href="/products">
            <Search aria-hidden="true" className="size-5" />
            {t("client.empty.browseProducts")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
