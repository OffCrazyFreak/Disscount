import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import type { ShoppingListDto } from "@/lib/api/types";
import { useUser } from "@/context/user-context";
import { suggestedChain } from "@/components/custom/store-chain/suggested-chain";
import {
  findCheapestStoreFromProduct,
  formatShoppingListForSharing,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import { productLookupQuery } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/product-lookup-query";

/** Cache only, because waiting on the network can outlast the tap's permission to open the share sheet. */
export function useListShareText() {
  const t = useTranslations("shoppingLists");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { accountUser } = useUser();

  return function listShareText(shoppingList: ShoppingListDto) {
    const suggestedChains: Record<string, string> = {};

    for (const item of shoppingList.items) {
      if (!item.ean) continue;

      const product = queryClient.getQueryData(
        productLookupQuery(item.ean).queryKey,
      );
      const cheapest =
        product &&
        findCheapestStoreFromProduct(product, accountUser?.pinnedStores);
      const chain = suggestedChain(item.chainCode, item.isChecked, cheapest);

      if (chain) suggestedChains[item.id] = chain;
    }

    return formatShoppingListForSharing(
      shoppingList,
      t,
      locale,
      suggestedChains,
    );
  };
}
