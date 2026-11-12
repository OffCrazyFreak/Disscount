import type { LinkAccess } from "@/lib/api/types";

/** UI copy, so it lives here; the schema's enum keys these, which stops a new level rendering blank. */

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

/** Third person for shared levels, agreeing with "svatko"; NONE is second person, about the owner. */
export const LINK_ACCESS_HINT_KEYS = {
  NONE: "linkAccess.hint.NONE",
  VIEW: "linkAccess.hint.VIEW",
  SHOP: "linkAccess.hint.SHOP",
  EDIT: "linkAccess.hint.EDIT",
} as const satisfies Record<LinkAccess, string>;
