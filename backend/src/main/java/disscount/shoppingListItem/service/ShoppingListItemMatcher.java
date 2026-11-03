package disscount.shoppingListItem.service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import disscount.shoppingListItem.domain.ShoppingListItem;

/**
 * Finds the row an added item merges into. Catalog products match by EAN, because two products
 * can share a name; plain items match by name ignoring case and outer whitespace. A catalog
 * product also takes over a plain row of the same name, which links that row to its prices.
 *
 * <p>Matching runs in Java over the list's items, not in SQL, so Croatian letters fold the same
 * way on Postgres (whose lower() depends on the database collation) and on H2.
 */
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
