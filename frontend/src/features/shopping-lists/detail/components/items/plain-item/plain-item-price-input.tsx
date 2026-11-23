import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { formatPrice } from "@/utils/price/price";
import type { IShoppingListItemUpdate } from "@/features/shopping-lists/detail/typings/shopping-list-item-types";

// The backend column is numeric(10,4).
const MAX_PRICE = 999999.99;

interface IPlainItemPriceInputProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  canCheck: boolean;
}

/** Undefined for text that is not a price, so a typo never erases the saved one; blank or zero clears it. */
function parsePrice(text: string): number | null | undefined {
  const cleaned = text.replace(/[\s€]/g, "").replace(",", ".");
  if (cleaned === "") return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0 || value > MAX_PRICE) {
    return undefined;
  }

  const rounded = Math.round(value * 100) / 100;

  return rounded === 0 ? null : rounded;
}

// Grouping off, so "1.234,50" never reaches the parser as two separators.
function textOf(price: number | null, locale: string): string {
  return price === null
    ? ""
    : new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
      }).format(price);
}

/** Saved on leaving the field, so typing a price is one request, not one per key. */
export default function PlainItemPriceInput({
  item,
  onUpdate,
  canCheck,
}: IPlainItemPriceInputProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();
  const saved = item.storePrice ?? null;
  const [text, setText] = useState(textOf(saved, locale));

  if (!canCheck) {
    return (
      <div className="flex-shrink-0 text-sm text-muted-foreground">
        {saved === null ? t("items.noPrice") : formatPrice(saved, locale)}
      </div>
    );
  }

  function commit() {
    const parsed = parsePrice(text);
    const price = parsed === undefined ? saved : parsed;

    setText(textOf(price, locale));
    if (price === saved) return;

    onUpdate({
      isChecked: item.isChecked,
      amount: item.amount || 1,
      chainCode: item.chainCode ?? null,
      storePrice: price,
    });
  }

  return (
    <div className="relative z-20 flex flex-shrink-0 items-center gap-1 text-sm">
      <Input
        type="text"
        inputMode="decimal"
        aria-label={t("items.priceLabel", { name: item.name })}
        placeholder={t("items.noPrice")}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className="h-8 w-24 text-right"
      />
      <span aria-hidden="true" className="text-muted-foreground">
        €
      </span>
    </div>
  );
}
