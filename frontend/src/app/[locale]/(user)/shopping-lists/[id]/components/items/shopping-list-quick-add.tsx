"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from "@/components/reui/autocomplete";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { MAX_SHOPPING_LIST_ITEM_NAME_LENGTH } from "@/constants/shopping-list";
import { useQuickAddItem } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-quick-add-item";

interface IShoppingListQuickAddProps {
  listId: string;
}

export default function ShoppingListQuickAdd({
  listId,
}: IShoppingListQuickAddProps) {
  const t = useTranslations("shoppingListDetail.quickAdd");
  const {
    text,
    setText,
    suggestions,
    lastAdded,
    isSearching,
    hasSearched,
    addTypedText,
    pickSuggestion,
  } = useQuickAddItem(listId);
  const [highlighted, setHighlighted] = useState<ProductResponse>();
  const inputId = `quick-add-${listId}`;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || highlighted) return;

    event.preventDefault();
    addTypedText();
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-2 focus-within:border-solid focus-within:border-primary">
      <label htmlFor={inputId} className="sr-only">
        {t("label")}
      </label>

      <div className="relative min-w-0 flex-1">
        <Plus
          aria-hidden="true"
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-primary"
        />

        <Autocomplete
          items={suggestions}
          filter={null}
          itemToStringValue={(product: ProductResponse) => product.name ?? ""}
          value={text}
          onValueChange={(value, details) => {
            if (details.reason !== "item-press") setText(value);
          }}
          onItemHighlighted={(product) => setHighlighted(product)}
          // A pointer resting on a suggestion must not turn Enter into opening it.
          highlightItemOnHover={false}
        >
          <AutocompleteInput
            id={inputId}
            placeholder={t("label")}
            autoComplete="off"
            enterKeyHint="done"
            maxLength={MAX_SHOPPING_LIST_ITEM_NAME_LENGTH}
            onKeyDown={handleKeyDown}
            className="h-10 border-transparent bg-background ps-8 text-base md:text-sm"
          />

          <AutocompleteContent className="motion-reduce:transition-none">
            <AutocompleteStatus>
              {isSearching
                ? t("searching")
                : hasSearched &&
                  t("suggestions", { count: suggestions.length })}
            </AutocompleteStatus>

            <AutocompleteList>
              {(product: ProductResponse) => (
                <AutocompleteItem
                  key={product.ean}
                  value={product}
                  onClick={() => pickSuggestion(product)}
                  className="cursor-pointer flex-col items-start gap-0 hover:bg-accent"
                >
                  <span lang="hr">{product.name}</span>
                  {product.brand && (
                    <span lang="hr" className="text-xs text-muted-foreground">
                      {product.brand}
                    </span>
                  )}
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        </Autocomplete>
      </div>

      {/* The new row only appears after a refetch, so the add is announced here. */}
      <p role="status" className="sr-only">
        {lastAdded.name && t("added", { name: lastAdded.name })}
        {/* Screen readers skip a repeat of identical text, so every other add differs. */}
        {lastAdded.count % 2 === 1 && "\u00A0"}
      </p>

      <Button
        type="button"
        onClick={() => {
          addTypedText();
          // Clearing the text disables this button, which would drop focus to the page.
          document.getElementById(inputId)?.focus();
        }}
        disabled={!text.trim()}
        className="h-10 shrink-0"
      >
        {t("add")}
      </Button>
    </div>
  );
}
