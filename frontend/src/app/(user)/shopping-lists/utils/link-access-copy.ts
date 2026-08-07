import type { LinkAccess } from "@/lib/api/types";

/**
 * Every string the share panel puts on screen for a link access level.
 *
 * This is UI copy, not part of the API contract, so it lives with the feature rather than
 * in `lib/api/schemas`. The schema there still owns the enum these are keyed by, which is
 * what keeps a new level from silently rendering blank.
 */

/** All four levels, in the order the select offers them. Private is a level, not an off switch. */
export const LINK_ACCESS_LEVELS = ["NONE", "VIEW", "SHOP", "EDIT"] as const;

/** The select's option labels. Short, because they sit inside the trigger. */
export const LINK_ACCESS_LABELS: Record<LinkAccess, string> = {
  NONE: "Privatno",
  VIEW: "Pregled",
  SHOP: "Kupovina",
  EDIT: "Uređivanje",
};

/**
 * The headline beside the icon. Answers "who can reach this list", the way Google splits
 * Restricted from Anyone with the link, while the level itself stays in the select.
 */
export const LINK_ACCESS_ROW_TITLES: Record<LinkAccess, string> = {
  NONE: "Privatan popis",
  VIEW: "Svatko s poveznicom",
  SHOP: "Svatko s poveznicom",
  EDIT: "Svatko s poveznicom",
};

/**
 * What the level actually permits, under the headline.
 *
 * Third person SINGULAR for the shared levels: the subject is the row's own headline,
 * "Svatko s poveznicom", and "svatko" takes a singular verb in Croatian, so it is "može"
 * rather than "mogu". NONE is second person, because an unshared list really is about the
 * owner rather than about anyone holding a link.
 */
export const LINK_ACCESS_HINTS: Record<LinkAccess, string> = {
  NONE: "Dijeljenje je isključeno, samo ti možeš otvoriti ovaj popis.",
  VIEW: "Vidi cijeli popis, ali ga ne može uređivati.",
  SHOP: "Vidi cijeli popis, no može i birati trgovinu te označiti što je kupljeno.",
  // The limit is stated rather than left to be discovered: /api/shared has no endpoint for
  // creating items at all, and renaming has one but no control. Both wait for the
  // membership work, where per-person revocation makes unbounded additions safe to grant.
  EDIT: "Može uređivati cijeli popis, ali ne može dodavati nove proizvode.",
};
