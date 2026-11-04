package disscount.shoppingList.domain;

/** OWNER is produced by ShoppingListAccessService and never persisted. */
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

    /** Separate from canManageShare because deleting and adding are ownership questions, so a link level managing sharing must not grant them. */
    public boolean isOwner() {
        return this == OWNER;
    }
}
