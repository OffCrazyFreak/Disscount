import type { ListAccess } from "@/lib/api/types";

export interface IShoppingListAccess {
  isOwner: boolean;
  /** Tick an item off, switch its store. */
  canCheck: boolean;
  /** Amount, removal, and the list title. */
  canEditItems: boolean;
  canManageShare: boolean;
}

/** Mirrors backend ListAccess: the server sends myAccess, so nothing reads the session and the answer matches the API's. */
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

/** Lives here because importing it from a "use client" component would pull that whole component's tree in for a string. */
export const SHARED_ACCESS_BANNER_ID = "shared-list-access";
