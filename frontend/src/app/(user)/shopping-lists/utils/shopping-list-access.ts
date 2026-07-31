import type { ListAccess } from "@/lib/api/types";

export interface IShoppingListAccess {
  isOwner: boolean;
  /** Tick an item off, switch its store. */
  canCheck: boolean;
  /** Amount, removal, and the list title. */
  canEditItems: boolean;
  canManageShare: boolean;
}

/**
 * Mirrors ListAccess on the backend. The server resolves myAccess and sends it with the
 * list, so nothing here reads the session: a component that asks "may I?" gets the same
 * answer the API would give, and an anonymous visitor is already capped at VIEW upstream.
 */
export function resolveShoppingListAccess(
  myAccess: ListAccess | undefined,
): IShoppingListAccess {
  const isOwner = myAccess === "OWNER";
  const canEditItems = myAccess === "EDIT" || isOwner;

  return {
    isOwner,
    canCheck: myAccess === "SHOP" || canEditItems,
    canEditItems,
    canManageShare: isOwner,
  };
}
