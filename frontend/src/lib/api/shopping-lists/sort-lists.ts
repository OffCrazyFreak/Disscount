import type { ShoppingListDto } from "@/lib/api/types";
import { parseServerDate } from "@/utils/date";

/** NaN from a bad timestamp would skip the tiebreaks below, as the spec coerces it to 0. */
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
