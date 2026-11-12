package disscount.shared.errors;

/**
 * The owner's per-user caps (PR #693 for lists and cards, issue #709 for product photos); each caller decides which
 * rows count. A refusal answers 409 with {@link #code()}.
 */
public enum UserLimit {

    SHOPPING_LISTS(50, "error.limit.shoppingLists"),
    SHOPPING_LIST_ITEMS(50, "error.limit.shoppingListItems"),
    WATCHLIST_ITEMS(50, "error.limit.watchlist"),
    DIGITAL_CARDS(50, "error.limit.digitalCards"),
    PRODUCT_PHOTOS(300, "error.limit.productPhotos"),
    PRODUCT_PHOTOS_PER_DAY(75, "error.limit.productPhotosPerDay"),
    PRODUCT_PHOTOS_PER_PRODUCT(3, "error.limit.productPhotosPerProduct");

    private final int max;
    private final String code;

    UserLimit(int max, String code) {
        this.max = max;
        this.code = code;
    }

    public int max() {
        return max;
    }

    public String code() {
        return code;
    }

    /** Call under the owner's row lock, or two creates at the cap both see room. */
    public void requireRoomFor(long existing, long adding) {
        if (existing + adding > max) {
            throw new LimitReachedException(this);
        }
    }
}
