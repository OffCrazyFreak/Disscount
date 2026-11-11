package disscount.shared;

/** The owner's per-user caps from #213, counting live rows only; a refusal answers 409 with {@link #code()}. */
public enum UserLimit {

    SHOPPING_LISTS(50, "error.limit.shoppingLists"),
    SHOPPING_LIST_ITEMS(50, "error.limit.shoppingListItems"),
    WATCHLIST_ITEMS(50, "error.limit.watchlist"),
    DIGITAL_CARDS(50, "error.limit.digitalCards");

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
