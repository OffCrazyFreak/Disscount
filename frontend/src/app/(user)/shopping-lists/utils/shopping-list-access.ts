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

/**
 * Id of the element explaining what the current caller may do, so a control this resolver
 * disables can point at the reason with aria-describedby. Lives here rather than in the
 * banner component: it is a contract between the item row and the access banner on the
 * same route, and importing it from a "use client" component would pull that whole
 * component's tree in for a string.
 */
export const SHARED_ACCESS_BANNER_ID = "shared-list-access";
