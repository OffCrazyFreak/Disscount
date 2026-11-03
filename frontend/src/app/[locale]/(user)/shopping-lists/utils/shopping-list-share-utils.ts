import type { useTranslations } from "next-intl";
import type { ShoppingListDto, ShoppingListItemDto } from "@/lib/api/types";
import { getChainLabel } from "@/utils/labels";
import { compareHr, formatDate } from "@/utils/strings";

type ShoppingListsTranslator = ReturnType<
  typeof useTranslations<"shoppingLists">
>;

// Open-ended rules, so a long title never has to line up with a closing corner.
const RULE = "═".repeat(18);

/**
 * None of these clients define an escape syntax for their own markers, so a
 * backslash renders literally. Lookalikes read the same and cannot open a run.
 */
function neutraliseMarkers(text: string): string {
  return text.replace(/\*/g, "\u2217").replace(/~/g, "\u2053");
}

/**
 * WhatsApp, Viber and Messenger all read *bold* and ~strikethrough~, and all
 * need the markers to sit against a space, so a bought item reads as crossed off
 * rather than as another thing left to find.
 */
function strikeWhenChecked(text: string, isChecked: boolean): string {
  return isChecked ? `~${text}~` : text;
}

/**
 * Format shopping list as text for sharing
 * Sorts items by checked status, then shop (chainCode), then brand, then name
 * @param shoppingList The shopping list to format
 * @param t Translator for the "shoppingLists" namespace
 * @param locale Active locale, for the dates
 * @param suggestedChains Item id to the chain its store select suggests, for items with none saved
 * @returns Formatted text ready to share
 */
export function formatShoppingListForSharing(
  shoppingList: ShoppingListDto,
  t: ShoppingListsTranslator,
  locale: string,
  suggestedChains: Readonly<Record<string, string>>,
): string {
  const shownChain = (item: ShoppingListItemDto) =>
    item.chainCode ?? suggestedChains[item.id] ?? "";

  // Sort items: unchecked first, then by shop, brand, and name
  const sortedItems = [...shoppingList.items].sort((a, b) => {
    if (a.isChecked !== b.isChecked) {
      return a.isChecked ? 1 : -1;
    }

    const shopA = shownChain(a);
    const shopB = shownChain(b);
    if (shopA !== shopB) {
      return compareHr(shopA, shopB);
    }

    const brandA = a.brand || "";
    const brandB = b.brand || "";
    if (brandA !== brandB) {
      return compareHr(brandA, brandB);
    }

    return compareHr(a.name, b.name);
  });

  let shareText = `╔${RULE}\n`;
  shareText += `📋 *${neutraliseMarkers(shoppingList.title)}*\n`;
  shareText += `╚${RULE}\n\n`;
  shareText += `${t("shareText.created", { date: formatDate(shoppingList.createdAt, locale) })}\n`;
  shareText += `${t("shareText.updated", { date: formatDate(shoppingList.updatedAt, locale) })}\n\n`;

  sortedItems.forEach((item, index) => {
    const number = index + 1;
    const checkbox = item.isChecked ? "✅" : "⬜";
    const name = neutraliseMarkers(item.name);
    const brand = item.brand ? ` - ${neutraliseMarkers(item.brand)}` : "";
    const unit = neutraliseMarkers(item.unit || "");
    const quantity = neutraliseMarkers(item.quantity || "");
    const unitAndQuantity =
      unit && quantity
        ? ` (${quantity} ${unit})`
        : unit
          ? ` (${unit})`
          : quantity
            ? ` (${quantity})`
            : "";
    const amount = item.amount > 1 ? ` x${item.amount}` : "";

    const chain = shownChain(item);
    const storeName = chain ? neutraliseMarkers(getChainLabel(chain)) : "";
    const store = storeName ? ` - ${storeName}` : "";

    const details = `${name}${brand}${unitAndQuantity}${amount}${store}`;

    shareText += `${number}. ${checkbox} ${strikeWhenChecked(details, item.isChecked)}\n`;
  });

  shareText += `\n╔${RULE}\n`;
  shareText += `${t("shareText.footerCreatedWith")}\n`;
  shareText += `${t("shareText.footerCompare")}\n`;
  shareText += `${t("shareText.footerTry")}\n`;
  shareText += `╚${RULE}\n`;

  return shareText;
}
