package disscount.productimage.catalog;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/** Chains spell the same word with and without accents and in any case, so names compare in one folded form. */
final class TextFold {

    private static final Pattern MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern SEPARATORS = Pattern.compile("[^a-z0-9]+");

    private TextFold() {}

    /** Lower case ASCII words split by single spaces: "Čokoladno MLIJEKO 0,5L" becomes "cokoladno mlijeko 0 5l". */
    static String fold(String text) {
        if (text == null) return "";

        // Đ has no decomposed form, so NFD alone would drop it instead of turning it into d.
        String decomposed = Normalizer.normalize(text.replace('đ', 'd').replace('Đ', 'D'), Normalizer.Form.NFD);
        String plain = MARKS.matcher(decomposed).replaceAll("").toLowerCase(Locale.ROOT);
        return SEPARATORS.matcher(plain).replaceAll(" ").strip();
    }

    static String[] words(String text) {
        String folded = fold(text);
        return folded.isEmpty() ? new String[0] : folded.split(" ");
    }
}
