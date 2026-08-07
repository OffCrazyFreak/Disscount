package disscount.shoppingList.domain;

/**
 * What a caller may do with a shopping list.
 *
 * <p>Only NONE, VIEW, SHOP and EDIT are ever stored in {@code shopping_list.link_access}.
 * OWNER is produced by {@link disscount.shoppingList.service.ShoppingListAccessService}
 * and never persisted.
 */
public enum ListAccess {

    NONE,
    VIEW,
    SHOP,
    EDIT,
    OWNER;

    public boolean canView() {
        return this != NONE;
    }

    /** The in-the-shop level: tick an item off, switch its store, snapshot its price. */
    public boolean canCheck() {
        return this == SHOP || this == EDIT || this == OWNER;
    }

    /** Amount, removal and the list title. Adding items arrives with membership. */
    public boolean canEditItems() {
        return this == EDIT || this == OWNER;
    }

    public boolean canManageShare() {
        return this == OWNER;
    }

    /**
     * Kept separate from {@link #canManageShare()} even though the two agree today. Deleting
     * a list and adding items to it are ownership questions, not sharing ones, so a future
     * decision to let some link level manage sharing must not quietly grant either.
     */
    public boolean isOwner() {
        return this == OWNER;
    }
}
