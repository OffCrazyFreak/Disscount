import type { LinkAccess } from "@/lib/api/types";

/**
 * Message keys for every string the share panel puts on screen for a link access level. UI
 * copy, not the API contract, so it lives with the feature; the schema still owns the enum these are
 * keyed by, which stops a new level rendering blank. See `docs/SHARING.md` §2.
 */

/** Private is a level, not an off switch, so it sits in the same select as the rest. */
export const LINK_ACCESS_LEVELS = ["NONE", "VIEW", "SHOP", "EDIT"] as const;

export const LINK_ACCESS_LABEL_KEYS = {
  NONE: "linkAccess.label.NONE",
  VIEW: "linkAccess.label.VIEW",
  SHOP: "linkAccess.label.SHOP",
  EDIT: "linkAccess.label.EDIT",
} as const satisfies Record<LinkAccess, string>;

export const LINK_ACCESS_ROW_TITLE_KEYS = {
  NONE: "linkAccess.rowTitle.private",
  VIEW: "linkAccess.rowTitle.shared",
  SHOP: "linkAccess.rowTitle.shared",
  EDIT: "linkAccess.rowTitle.shared",
} as const satisfies Record<LinkAccess, string>;

/**
 * Third person singular for the shared levels, agreeing with the row title above them:
 * "svatko" takes a singular verb, so "može" rather than "mogu". NONE is second person,
 * since an unshared list is about its owner.
 */
export const LINK_ACCESS_HINT_KEYS = {
  NONE: "linkAccess.hint.NONE",
  VIEW: "linkAccess.hint.VIEW",
  SHOP: "linkAccess.hint.SHOP",
  EDIT: "linkAccess.hint.EDIT",
} as const satisfies Record<LinkAccess, string>;
