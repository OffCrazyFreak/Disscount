import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";

interface IShoppingListStoresBodyProps {
  isLoading: boolean;
  hasItems: boolean;
  hasActiveItems: boolean;
  hasError: boolean;
  hasChains: boolean;
  children: ReactNode;
}

function storesMessageKey(
  hasItems: boolean,
  hasActiveItems: boolean,
  hasError: boolean,
  hasChains: boolean,
) {
  if (!hasItems) return "stores.noItems";
  if (!hasActiveItems) return "stores.allChecked";
  if (hasError) return "stores.loadError";
  if (!hasChains) return "stores.noPrices";
  return null;
}

/** Shows why there is nothing to compare yet, in priority order, or the stores. */
export default function ShoppingListStoresBody({
  isLoading,
  hasItems,
  hasActiveItems,
  hasError,
  hasChains,
  children,
}: IShoppingListStoresBodyProps) {
  const t = useTranslations("shoppingListDetail");

  if (isLoading)
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
      </div>
    );

  const messageKey = storesMessageKey(
    hasItems,
    hasActiveItems,
    hasError,
    hasChains,
  );

  if (messageKey)
    return <p className="p-2 text-gray-600 text-center">{t(messageKey)}</p>;

  return children;
}
