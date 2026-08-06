package disscount.shoppingList.domain;

/**
 * The levels a share link can actually be set to, which is every {@link ListAccess} value
 * except OWNER.
 *
 * <p>This is a separate enum rather than a validated {@code ListAccess} so that OWNER is not
 * expressible on the wire at all. Jackson rejects it during deserialization, before any
 * service code runs, which means the guard in {@code ShoppingListService.applyLinkAccess} is
 * no longer the only thing standing between a typo and a caller granting themselves the
 * ability to manage sharing.
 */
public enum LinkAccess {

    NONE,
    VIEW,
    SHOP,
    EDIT;

    public ListAccess toListAccess() {
        return ListAccess.valueOf(name());
    }
}
