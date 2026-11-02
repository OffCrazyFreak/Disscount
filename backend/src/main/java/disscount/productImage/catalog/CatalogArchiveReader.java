package disscount.productImage.catalog;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Reads a cijene daily archive (one folder per chain with products.csv and prices.csv) into
 * barcode, a display name and how many store prices list it. Entry order inside the ZIP is not
 * guaranteed, so prices are counted per chain product id and joined to barcodes at the end.
 */
public final class CatalogArchiveReader {

    public record Entry(String name, String brand, int storeListings, int chainCount) {}

    private record Product(String ean, String name, String brand) {}

    private CatalogArchiveReader() {}

    public static Map<String, Entry> read(InputStream archive) throws IOException {
        Map<String, Map<String, Product>> productsByChain = new HashMap<>();
        Map<String, Map<String, Integer>> listingsByChain = new HashMap<>();

        try (ZipInputStream zip = new ZipInputStream(archive, StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String[] parts = entry.getName().split("/");
                if (entry.isDirectory() || parts.length != 2) continue;

                String chain = parts[0];
                // The reader must not close the ZIP stream, which holds the next entries.
                BufferedReader lines = new BufferedReader(new InputStreamReader(zip, StandardCharsets.UTF_8));
                if (parts[1].equals("products.csv")) {
                    productsByChain.put(chain, readProducts(lines));
                } else if (parts[1].equals("prices.csv")) {
                    listingsByChain.put(chain, countListings(lines));
                }
            }
        }
        return join(productsByChain, listingsByChain);
    }

    private static Map<String, Product> readProducts(BufferedReader lines) throws IOException {
        Map<String, Integer> col = header(lines.readLine());
        Map<String, Product> byId = new HashMap<>();
        String line;
        while ((line = lines.readLine()) != null) {
            List<String> f = CsvLine.split(line);
            String barcode = field(f, col, "barcode").trim();
            if (!Barcodes.isPublicGtin(barcode)) continue;
            byId.put(field(f, col, "product_id"),
                    new Product(barcode, field(f, col, "name").trim(), field(f, col, "brand").trim()));
        }
        return byId;
    }

    private static Map<String, Integer> countListings(BufferedReader lines) throws IOException {
        Map<String, Integer> col = header(lines.readLine());
        Integer productColumn = col.get("product_id");
        Map<String, Integer> counts = new HashMap<>();
        if (productColumn == null) return counts;

        String line;
        while ((line = lines.readLine()) != null) {
            List<String> f = CsvLine.split(line);
            if (productColumn < f.size()) counts.merge(f.get(productColumn), 1, Integer::sum);
        }
        return counts;
    }

    private static Map<String, Entry> join(Map<String, Map<String, Product>> productsByChain,
                                           Map<String, Map<String, Integer>> listingsByChain) {
        Map<String, Integer> listings = new HashMap<>();
        Map<String, Set<String>> chains = new HashMap<>();
        Map<String, Product> firstSeen = new HashMap<>();

        productsByChain.forEach((chain, products) -> {
            Map<String, Integer> counts = listingsByChain.getOrDefault(chain, Map.of());
            products.forEach((id, product) -> {
                listings.merge(product.ean(), counts.getOrDefault(id, 0), Integer::sum);
                chains.computeIfAbsent(product.ean(), e -> new HashSet<>()).add(chain);
                firstSeen.putIfAbsent(product.ean(), product);
            });
        });

        Map<String, Entry> result = new HashMap<>();
        firstSeen.forEach((ean, product) -> result.put(ean, new Entry(
                truncate(product.name(), 200), truncate(product.brand(), 120),
                listings.get(ean), chains.get(ean).size())));
        return result;
    }

    private static Map<String, Integer> header(String line) {
        Map<String, Integer> col = new HashMap<>();
        if (line == null) return col;
        List<String> names = CsvLine.split(line.replace("\uFEFF", ""));
        for (int i = 0; i < names.size(); i++) col.put(names.get(i).trim(), i);
        return col;
    }

    private static String field(List<String> fields, Map<String, Integer> col, String name) {
        Integer i = col.get(name);
        return i == null || i >= fields.size() ? "" : fields.get(i);
    }

    private static String truncate(String value, int max) {
        if (value == null || value.isEmpty()) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
