package disscount.productImage.off;

/** URL layout from https://openfoodfacts.github.io/openfoodfacts-server/api/how-to-download-images/ */
public final class OffImageUrls {

    static final String BASE = "https://images.openfoodfacts.org/images/products/";

    private OffImageUrls() {}

    static String folder(String ean) {
        String code = ean;
        if (code.length() < 13) {
            code = "0".repeat(13 - code.length()) + code;
        }
        return code.substring(0, 3) + "/" + code.substring(3, 6) + "/" + code.substring(6, 9) + "/" + code.substring(9);
    }

    /** externalKey is "front_hr" for a selected image (needs its rev) or "raw:100" for an uploaded one. */
    public static String full(String ean, String externalKey, String rev) {
        return url(ean, externalKey, rev, "full");
    }

    public static String preview(String ean, String externalKey, String rev) {
        return url(ean, externalKey, rev, "400");
    }

    private static String url(String ean, String externalKey, String rev, String size) {
        String folder = BASE + folder(ean) + "/";
        if (externalKey.startsWith("raw:")) {
            String id = externalKey.substring(4);
            return folder + id + ("full".equals(size) ? "" : "." + size) + ".jpg";
        }
        return folder + externalKey + "." + rev + "." + size + ".jpg";
    }
}
