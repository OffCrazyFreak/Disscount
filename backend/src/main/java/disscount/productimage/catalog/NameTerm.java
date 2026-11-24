package disscount.productimage.catalog;

import java.util.Arrays;
import java.util.List;

/**
 * One rule term: words that must follow each other in a product name. A word ending in * matches any word that
 * starts with it, for Croatian endings (mlijek* takes mlijeko, mlijeka, mlijekom); a phrase starting with ^ must
 * open the name, where chains write the product type; phrases joined by & must all appear, in any order.
 */
record NameTerm(List<Phrase> phrases) {

    record Phrase(String[] words, boolean[] prefix, boolean atStart) {

        static Phrase parse(String text, String term) {
            boolean atStart = text.startsWith("^");
            String[] raw = (atStart ? text.substring(1) : text).strip().split("\\s+");

            String[] words = new String[raw.length];
            boolean[] prefix = new boolean[raw.length];
            for (int i = 0; i < raw.length; i++) {
                prefix[i] = raw[i].endsWith("*");
                words[i] = TextFold.fold(prefix[i] ? raw[i].substring(0, raw[i].length() - 1) : raw[i]);
                if (words[i].isEmpty() || words[i].contains(" ")) {
                    throw new IllegalArgumentException("Catalogue rule term is not one word per space: " + term);
                }
            }
            return new Phrase(words, prefix, atStart);
        }

        boolean matches(String[] name) {
            int lastStart = atStart ? 0 : name.length - words.length;
            for (int start = 0; start <= lastStart; start++) {
                if (matchesAt(name, start)) return true;
            }
            return false;
        }

        private boolean matchesAt(String[] name, int start) {
            if (start + words.length > name.length) return false;

            for (int i = 0; i < words.length; i++) {
                String word = name[start + i];
                boolean same = prefix[i] ? word.startsWith(words[i]) : word.equals(words[i]);
                if (!same) return false;
            }
            return true;
        }
    }

    static NameTerm parse(String term) {
        return new NameTerm(Arrays.stream(term.split("&")).map(phrase -> Phrase.parse(phrase.strip(), term)).toList());
    }

    boolean matches(String[] name) {
        return phrases.stream().allMatch(phrase -> phrase.matches(name));
    }
}
