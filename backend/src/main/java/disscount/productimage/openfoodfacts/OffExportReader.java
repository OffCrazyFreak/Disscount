package disscount.productimage.openfoodfacts;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;

import disscount.productimage.catalog.Barcodes;

public final class OffExportReader {

    public record Front(String externalKey, String rev, String lang) {}

    // image_url points at the selected front, e.g. .../front_en.1129.400.jpg
    private static final Pattern FRONT = Pattern.compile("/(front_([a-z]{2,3}))\\.(\\d+)\\.\\d+\\.jpg$");

    private OffExportReader() {}

    /** wantedByMatchKey maps a barcode without leading zeros to the EAN we store. */
    public static Map<String, Front> read(InputStream gzipped, Map<String, String> wantedByMatchKey) throws IOException {
        Map<String, Front> fronts = new HashMap<>();
        try (BufferedReader lines = new BufferedReader(
                new InputStreamReader(new GZIPInputStream(gzipped, 1 << 16), StandardCharsets.UTF_8), 1 << 16)) {
            String header = lines.readLine();
            if (header == null) return fronts;

            String[] names = header.split("\t", -1);
            int code = indexOf(names, "code");
            int image = indexOf(names, "image_url");
            if (code < 0 || image < 0) throw new IOException("Unexpected export header");

            String line;
            while ((line = lines.readLine()) != null) {
                // Under 1% of rows are products we carry, so look at the code before splitting 200 columns.
                if (code == 0) {
                    int tab = line.indexOf('\t');
                    if (tab < 0 || !wantedByMatchKey.containsKey(Barcodes.matchKey(line.substring(0, tab).trim()))) continue;
                }
                String[] f = line.split("\t", -1);
                if (f.length <= Math.max(code, image)) continue;

                String ean = wantedByMatchKey.get(Barcodes.matchKey(f[code].trim()));
                if (ean == null || f[image].isEmpty()) continue;

                Matcher m = FRONT.matcher(f[image]);
                if (m.find()) fronts.putIfAbsent(ean, new Front(m.group(1), m.group(3), m.group(2)));
            }
        }
        return fronts;
    }

    private static int indexOf(String[] names, String name) {
        for (int i = 0; i < names.length; i++) {
            if (names[i].equals(name)) return i;
        }
        return -1;
    }
}
