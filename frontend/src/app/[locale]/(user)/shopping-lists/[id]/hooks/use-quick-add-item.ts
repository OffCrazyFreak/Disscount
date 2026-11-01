"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { shoppingListService } from "@/lib/api";
import { useGetProductByName } from "@/lib/cijene-api";
import { listWriteFailed } from "@/lib/offline/list-write-failed";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ProductResponse } from "@/lib/cijene-api/schemas";

// Algolia's autocomplete guide puts the comfortable range at 200 to 300 ms.
const SUGGESTION_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 8;

/** The quick-add field's text, its catalog suggestions, and the two ways to add. */
export function useQuickAddItem(listId: string) {
  const tUi = useTranslations("ui");
  const [text, setText] = useState("");
  const query = useDebouncedValue(text.trim(), SUGGESTION_DEBOUNCE_MS);
  // Checks the live text too, so a just-cleared field drops the old suggestions at once.
  const hasQuery =
    query.length >= MIN_QUERY_LENGTH && text.trim().length >= MIN_QUERY_LENGTH;
  const [lastAdded, setLastAdded] = useState("");

  const suggestionsQuery = useGetProductByName({
    q: hasQuery ? query : "",
    limit: SUGGESTION_LIMIT,
  });
  const suggestions = hasQuery ? (suggestionsQuery.data?.products ?? []) : [];
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  function addTypedText() {
    const name = text.trim();
    if (!name) return;

    setText("");
    addItemMutation.mutate(
      { listId, data: { name, amount: 1, isChecked: false } },
      {
        onSuccess: () => setLastAdded(name),
        onError: (error) => {
          // Hand the text back unless the user already started the next item.
          setText((current) => current || name);
          listWriteFailed(error, tUi);
        },
      },
    );
  }

  function pickSuggestion(product: ProductResponse) {
    setText("");
    openModalUrl({ name: "add-to-list", ean: product.ean, listId });
  }

  return {
    text,
    setText,
    suggestions,
    lastAdded,
    isSearching: hasQuery && suggestionsQuery.isFetching,
    hasSearched: hasQuery && suggestionsQuery.isFetched,
    addTypedText,
    pickSuggestion,
  };
}
