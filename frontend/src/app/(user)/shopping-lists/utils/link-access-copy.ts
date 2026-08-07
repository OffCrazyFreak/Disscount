import type { LinkAccess } from "@/lib/api/types";

/**
 * Every string the share panel puts on screen for a link access level. UI copy, not the
 * API contract, so it lives with the feature; the schema still owns the enum these are
 * keyed by, which stops a new level rendering blank. See `docs/SHARING.md` §2.
 */

/** Private is a level, not an off switch, so it sits in the same select as the rest. */
export const LINK_ACCESS_LEVELS = ["NONE", "VIEW", "SHOP", "EDIT"] as const;

export const LINK_ACCESS_LABELS: Record<LinkAccess, string> = {
  NONE: "Privatno",
  VIEW: "Pregled",
  SHOP: "Kupovina",
  EDIT: "Uređivanje",
};

export const LINK_ACCESS_ROW_TITLES: Record<LinkAccess, string> = {
  NONE: "Privatan popis",
  VIEW: "Svatko s poveznicom",
  SHOP: "Svatko s poveznicom",
  EDIT: "Svatko s poveznicom",
};

/**
 * Third person singular for the shared levels, agreeing with the row title above them:
 * "svatko" takes a singular verb, so "može" rather than "mogu". NONE is second person,
 * since an unshared list is about its owner.
 */
export const LINK_ACCESS_HINTS: Record<LinkAccess, string> = {
  NONE: "Dijeljenje je isključeno, samo ti možeš otvoriti ovaj popis.",
  VIEW: "Vidi cijeli popis, ali ga ne može uređivati.",
  SHOP: "Vidi cijeli popis, no može i birati trgovinu te označiti što je kupljeno.",
  EDIT: "Može uređivati cijeli popis, ali ne može dodavati nove proizvode.",
};
