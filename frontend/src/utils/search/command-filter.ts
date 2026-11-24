import { scoreFields } from "@/utils/search/match";
import { prepareQuery } from "@/utils/search/normalize";

/** Keywords replace the value because cmdk scores `value`, often a code or UUID that surfaces unexplained rows. */
export function commandFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const prepared = prepareQuery(search);
  if (!prepared) return 1;

  return scoreFields(keywords?.length ? keywords : [value], prepared);
}
