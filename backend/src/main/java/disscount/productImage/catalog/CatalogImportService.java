package disscount.productImage.catalog;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/** Refreshes popularity and names for every EAN from the latest cijene daily archive. */
@Service
public class CatalogImportService {

    private static final Logger log = LoggerFactory.getLogger(CatalogImportService.class);
    private static final int BATCH = 1_000;

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final ObjectMapper json;
    private final String listUrl;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public CatalogImportService(JdbcTemplate jdbc, TransactionTemplate tx, ObjectMapper json,
                                @Value("${product-images.catalog.list-url:https://api.cijene.dev/v0/list}") String listUrl) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.json = json;
        this.listUrl = listUrl;
    }

    public int importLatest() throws IOException, InterruptedException {
        String archiveUrl = latestArchiveUrl();
        Map<String, CatalogArchiveReader.Entry> catalog;
        try (InputStream archive = open(archiveUrl)) {
            catalog = CatalogArchiveReader.read(archive);
        }
        tx.executeWithoutResult(status -> store(catalog));
        log.info("Product catalogue imported from {}: {} EANs", archiveUrl, catalog.size());
        return catalog.size();
    }

    void store(Map<String, CatalogArchiveReader.Entry> catalog) {
        Set<String> existing = new HashSet<>(jdbc.queryForList("select ean from product_image_set", String.class));
        // A product that left every chain drops to the bottom of the queue instead of keeping last week's rank.
        jdbc.update("update product_image_set set store_listings = 0, chain_count = 0");

        List<Object[]> updates = new ArrayList<>();
        List<Object[]> inserts = new ArrayList<>();
        catalog.forEach((ean, e) -> {
            if (existing.contains(ean)) {
                updates.add(new Object[] {e.name(), e.brand(), e.storeListings(), e.chainCount(), ean});
            } else {
                inserts.add(new Object[] {ean, e.name(), e.brand(), e.storeListings(), e.chainCount()});
            }
        });

        batch("update product_image_set set name = ?, brand = ?, store_listings = ?, chain_count = ? where ean = ?", updates);
        batch("insert into product_image_set (ean, name, brand, store_listings, chain_count, pinned, needs_review) "
                + "values (?, ?, ?, ?, ?, false, false)", inserts);
    }

    private void batch(String sql, List<Object[]> rows) {
        for (int from = 0; from < rows.size(); from += BATCH) {
            jdbc.batchUpdate(sql, rows.subList(from, Math.min(rows.size(), from + BATCH)));
        }
    }

    private String latestArchiveUrl() throws IOException, InterruptedException {
        try (InputStream body = open(listUrl)) {
            JsonNode archives = json.readTree(body).path("archives");
            if (!archives.isArray() || archives.isEmpty()) throw new IOException("No cijene archives listed");
            return archives.get(0).path("url").asText();
        }
    }

    private InputStream open(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("User-Agent", "Disscount/1.0 (https://disscount.me)")
                .GET()
                .build();
        HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
        if (response.statusCode() != 200) {
            response.body().close();
            throw new IOException(url + " answered " + response.statusCode());
        }
        return response.body();
    }
}
