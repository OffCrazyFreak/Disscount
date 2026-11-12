package disscount.shared;

/**
 * One spelling per product barcode, ported from cijene-api's normalize_barcode, where the app's product ids come from
 * (https://github.com/senko/cijene-api/blob/main/common/barcodes.py). GS1 treats a GTIN padded with leading zeros as the
 * same GTIN, so the zeros are stripped; in-store codes stay as sent, as they name a different product in every chain.
 */
public final class CanonicalBarcode {

    private static final int GTIN_8 = 8;
    private static final int GTIN_13 = 13;
    private static final int GTIN_14 = 14;

    private CanonicalBarcode() {}

    /** Leaves alone what is no GTIN: blanks, chain:id codes, anything not all digits or shorter than 8. */
    public static String of(String barcode) {
        if (barcode == null || barcode.isBlank()) return barcode;

        String code = barcode.strip();
        if (code.length() < GTIN_8 || !isDigits(code)) return code;

        String stripped = stripLeadingZeros(code);
        if (stripped.isEmpty() || isRestrictedCirculation(stripped)) return code;

        return stripped;
    }

    /**
     * GS1 restricted circulation numbers (General Specifications 1.4.1.2, 1.4.2, 1.4.3): GTIN-8 prefixes 0 and 2,
     * GTIN-13 prefixes 02, 04 and 20 to 29. Judged on the padded form, as stripping zeros can expose an inner digit.
     */
    public static boolean isRestrictedCirculation(String digits) {
        String code = stripLeadingZeros(digits);

        if (code.length() <= GTIN_8) {
            char first = padded(code, GTIN_8).charAt(0);
            return first == '0' || first == '2';
        }

        // A GTIN-14 is judged by the GTIN-13 behind its indicator digit.
        String prefix = code.length() <= GTIN_13
                ? padded(code, GTIN_13).substring(0, 2)
                : padded(code, GTIN_14).substring(1, 3);

        return prefix.equals("02") || prefix.equals("04") || prefix.charAt(0) == '2';
    }

    private static String stripLeadingZeros(String digits) {
        int i = 0;
        while (i < digits.length() && digits.charAt(i) == '0') i++;
        return digits.substring(i);
    }

    private static String padded(String digits, int length) {
        return "0".repeat(Math.max(0, length - digits.length())) + digits;
    }

    // ASCII only, as Character.isDigit also takes other scripts' digits, which no barcode holds.
    private static boolean isDigits(String value) {
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c < '0' || c > '9') return false;
        }
        return true;
    }
}
