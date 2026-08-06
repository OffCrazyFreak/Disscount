import type { ShoppingListDto } from "@/lib/api/types";
import { parseServerDate } from "@/utils/date";

/**
 * Newest first, which is what "your latest list" means everywhere it is offered.
 *
 * An unparseable timestamp yields NaN, and NaN !== 0 is true, so comparing it loosely
 * would return NaN and skip the tiebreaks below. The spec coerces that to 0, leaving the
 * order at whatever the API happened to return.
 */
export function sortShoppingListsByRecency(
  lists: ShoppingListDto[],
): ShoppingListDto[] {
  return lists.slice().sort((a, b) => {
    const updatedAtDifference =
      parseServerDate(b.updatedAt).getTime() -
      parseServerDate(a.updatedAt).getTime();
    if (Number.isFinite(updatedAtDifference) && updatedAtDifference !== 0) {
      return updatedAtDifference;
    }

    const createdAtDifference =
      parseServerDate(b.createdAt).getTime() -
      parseServerDate(a.createdAt).getTime();
    if (Number.isFinite(createdAtDifference) && createdAtDifference !== 0) {
      return createdAtDifference;
    }

    return b.id.localeCompare(a.id);
  });
}
