package disscount.shoppingListItem.service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import disscount.shoppingListItem.domain.ShoppingListItem;

/** Catalog products match by EAN because names can repeat; in Java, not SQL, so Croatian letters fold alike on Postgres and H2. */
final class ShoppingListItemMatcher {

    private ShoppingListItemMatcher() {
    }

    static Optional<ShoppingListItem> findMergeTarget(List<ShoppingListItem> items, String ean, String name) {
        String key = nameKey(name);

        if (ean == null) {
            return items.stream().filter(item -> nameKey(item.getName()).equals(key)).findFirst();
        }

        Optional<ShoppingListItem> sameProduct = items.stream()
                .filter(item -> ean.equals(item.getEan()))
                .findFirst();
        if (sameProduct.isPresent()) {
            return sameProduct;
        }

        return items.stream()
                .filter(item -> item.getEan() == null && nameKey(item.getName()).equals(key))
                .findFirst();
    }

    static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private static String nameKey(String name) {
        return name.strip().toLowerCase(Locale.ROOT);
    }
}
