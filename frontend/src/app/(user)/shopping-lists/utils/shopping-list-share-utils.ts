import { ShoppingListDto } from "@/lib/api/types";
import { getChainLabel } from "@/utils/labels";
import { formatDate } from "@/utils/strings";

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
 * @returns Formatted text ready to share
 */
export function formatShoppingListForSharing(
  shoppingList: ShoppingListDto,
): string {
  // Sort items: unchecked first, then by shop, brand, and name
  const sortedItems = [...shoppingList.items].sort((a, b) => {
    // First sort by checked status (unchecked items first)
    if (a.isChecked !== b.isChecked) {
      return a.isChecked ? 1 : -1;
    }

    // Sort by shop (chainCode)
    const shopA = a.chainCode || "";
    const shopB = b.chainCode || "";
    if (shopA !== shopB) {
      return shopA.localeCompare(shopB);
    }

    // Then by brand
    const brandA = a.brand || "";
    const brandB = b.brand || "";
    if (brandA !== brandB) {
      return brandA.localeCompare(brandB);
    }

    // Then by name
    return a.name.localeCompare(b.name);
  });

  let shareText = `╔${RULE}\n`;
  shareText += `📋 *${neutraliseMarkers(shoppingList.title)}*\n`;
  shareText += `╚${RULE}\n\n`;
  shareText += `📅 Stvoreno: ${formatDate(shoppingList.createdAt)}\n`;
  shareText += `🔄 Ažurirano: ${formatDate(shoppingList.updatedAt)}\n\n`;

  // Format items
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

    // Get store name from chainCode
    const storeName = item.chainCode
      ? neutraliseMarkers(getChainLabel(item.chainCode))
      : "";
    const store = storeName ? ` - ${storeName}` : "";

    const details = `${name}${brand}${unitAndQuantity}${amount}${store}`;

    shareText += `${number}. ${checkbox} ${strikeWhenChecked(details, item.isChecked)}\n`;
  });

  // Add branding footer
  shareText += `\n╔${RULE}\n`;
  shareText += `✨ *Popis stvoren pomoću Disscount*\n`;
  shareText += `💰 Usporedi cijene i uštedi!\n`;
  shareText += `🌐 Isprobaj besplatno na disscount.me\n`;
  shareText += `╚${RULE}\n`;

  return shareText;
}
