package disscount.storeName.service;

import java.text.Normalizer;
import java.util.Locale;

public final class StoreNameNormalizer {

    private StoreNameNormalizer() {}

    /** Display form: trimmed, inner whitespace collapsed. */
    public static String clean(String name) {
        return name == null ? "" : name.trim().replaceAll("\\s+", " ");
    }

    /** Dedup key: cleaned, lowercase, diacritics stripped, so "Žabac" and "zabac" are one name. */
    public static String normalize(String name) {
        String decomposed = Normalizer.normalize(clean(name), Normalizer.Form.NFD);
        // đ has no decomposition, so it is mapped by hand.
        return decomposed.replaceAll("\\p{M}+", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
    }
}
