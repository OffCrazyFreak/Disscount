package disscount.productImage.catalog;

public final class Barcodes {

    private Barcodes() {}

    /** A GTIN-8/12/13/14 with a valid check digit, minus the in-store codes no public database can know. */
    public static boolean isPublicGtin(String code) {
        if (code == null) return false;
        int length = code.length();
        if (length != 8 && length != 12 && length != 13 && length != 14) return false;
        for (int i = 0; i < length; i++) {
            if (!Character.isDigit(code.charAt(i))) return false;
        }
        // GS1 prefixes 20 to 29 are restricted circulation: weighed goods and a shop's own labels.
        if (length == 13 && code.charAt(0) == '2') return false;

        int sum = 0;
        for (int i = length - 2, weight = 3; i >= 0; i--, weight = 4 - weight) {
            sum += (code.charAt(i) - '0') * weight;
        }
        return (10 - sum % 10) % 10 == code.charAt(length - 1) - '0';
    }

    /** Leading zeros differ between sources for the same product, so matching ignores them. */
    public static String matchKey(String code) {
        int i = 0;
        while (i < code.length() - 1 && code.charAt(i) == '0') i++;
        return code.substring(i);
    }

    /** EANs as the product page uses them: plain digits, 8 to 14 long. */
    public static boolean isEanShape(String ean) {
        if (ean == null || ean.length() < 8 || ean.length() > 14) return false;
        for (int i = 0; i < ean.length(); i++) {
            if (!Character.isDigit(ean.charAt(i))) return false;
        }
        return true;
    }
}
