import { scoreFields } from "@/utils/search/match";
import { prepareQuery } from "@/utils/search/normalize";

/**
 * The app's matcher behind cmdk's `filter` contract, `(value, search, keywords)`
 * returning 0 to hide and higher-is-better to rank.
 *
 * cmdk scores the item's `value`, which at several call sites is a chain code or
 * a list id rather than anything the user can see. Keywords carry the visible
 * label, so when they are given they replace the value outright: otherwise
 * typing "trgovina" surfaces a row labelled "Jadranka", and a short hex query
 * surfaces shopping lists whose UUID merely contains those characters.
 *
 * Deliberately free of any cmdk import: this only has to match the shape, and
 * the matcher underneath is shared with the plain list pages.
 */
export function commandFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const prepared = prepareQuery(search);
  if (!prepared) return 1;

  return scoreFields(keywords?.length ? keywords : [value], prepared);
}
