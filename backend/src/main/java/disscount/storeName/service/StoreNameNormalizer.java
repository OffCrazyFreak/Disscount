package disscount.storeName.service;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Dedupe key for community store names. Mirrors normalizeForSearch in the frontend's
 * utils/strings.ts, so "Müller", "muller" and "MULLER  " collapse to one suggestion.
 */
public final class StoreNameNormalizer {

    private static final Locale CROATIAN = Locale.forLanguageTag("hr");

    private StoreNameNormalizer() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }

        String collapsed = raw.trim().replaceAll("\\s+", " ");

        // NFD splits accents into combining marks that \p{M} then strips, but it leaves
        // the Croatian đ alone, so that pair is mapped by hand.
        String stripped = Normalizer.normalize(collapsed, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .replace("Đ", "D");

        return stripped.toLowerCase(CROATIAN);
    }

    /** The display form stored alongside the key: trimmed, inner whitespace collapsed. */
    public static String toDisplayForm(String raw) {
        return raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
    }
}
