import { Search } from "lucide-react";

import type { ShoppingListDto } from "@/lib/api/types";
import ShoppingListItem from "@/app/[locale]/(user)/shopping-lists/components/shopping-list-item";
import ShoppingListsEmptyState from "@/app/[locale]/(user)/shopping-lists/components/shopping-lists-empty-state";
import NoResults from "@/components/custom/common/no-results";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";

interface IShoppingListsResultsProps {
  isLoading: boolean;
  shoppingLists: ShoppingListDto[];
  query: string;
}

export default function ShoppingListsResults({
  isLoading,
  shoppingLists,
  query,
}: IShoppingListsResultsProps) {
  if (isLoading)
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
      </div>
    );

  if (shoppingLists.length > 0)
    return (
      <>
        {shoppingLists.map((shoppingList) => (
          <ShoppingListItem key={shoppingList.id} shoppingList={shoppingList} />
        ))}
      </>
    );

  if (query)
    return (
      <NoResults
        icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
      />
    );

  return <ShoppingListsEmptyState />;
}
