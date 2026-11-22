package disscount.productimage.catalog;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@EnableConfigurationProperties(CatalogProperties.class)
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

    CatalogImportService(JdbcTemplate jdbc, TransactionTemplate tx, ObjectMapper json, CatalogProperties properties) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.json = json;
        this.listUrl = properties.listUrl();
    }

    public CatalogImportResult importLatest() throws IOException, InterruptedException {
        Archive latest = latestArchive();
        Map<String, CatalogArchiveReader.Entry> catalog;
        try (InputStream archive = open(latest.url())) {
            catalog = CatalogArchiveReader.read(archive);
        }
        CatalogImportResult result = tx.execute(status -> store(catalog, latest.date()));
        log.info("Product catalogue imported from {}: {} EANs, {} newly listed, {} dropped out", latest.url(),
                catalog.size(), result.newlyListed().size(), result.droppedOut().size());
        return result;
    }

    /** Updates the products in this archive only; the rest keep their last numbers until the listing window ends. */
    CatalogImportResult store(Map<String, CatalogArchiveReader.Entry> catalog, LocalDate archiveDate) {
        Set<String> listedBefore = listed();
        Set<String> existing = new HashSet<>(jdbc.queryForList("select ean from app.product_image_set", String.class));

        List<Object[]> updates = new ArrayList<>();
        List<Object[]> inserts = new ArrayList<>();
        catalog.forEach((ean, e) -> {
            // An unpriced catalogue row is not on sale, so it leaves the date of its last price alone.
            LocalDate seenOn = e.storeListings() > 0 ? archiveDate : null;
            if (existing.contains(ean)) {
                updates.add(new Object[] {e.name(), e.brand(), e.storeListings(), e.chainCount(), seenOn, ean});
            } else {
                inserts.add(new Object[] {ean, e.name(), e.brand(), e.storeListings(), e.chainCount(), seenOn});
            }
        });

        // greatest() skips a null and keeps a later date, so an older archive cannot move a product back in time.
        batch("update app.product_image_set set name = ?, brand = ?, store_listings = ?, chain_count = ?, "
                + "last_seen_on = greatest(last_seen_on, ?::date) where ean = ?", updates);
        batch("insert into app.product_image_set "
                + "(ean, name, brand, store_listings, chain_count, last_seen_on, pinned, needs_review) "
                + "values (?, ?, ?, ?, ?, ?::date, false, false)", inserts);

        Set<String> listedAfter = listed();
        return new CatalogImportResult(catalog.size(), difference(listedAfter, listedBefore),
                difference(listedBefore, listedAfter));
    }

    private Set<String> listed() {
        LocalDate newest = jdbc.queryForObject("select max(last_seen_on) from app.product_image_set", LocalDate.class);
        if (newest == null) return Set.of();

        return new HashSet<>(jdbc.queryForList("select ean from app.product_image_set where last_seen_on >= ?",
                String.class, CatalogListing.listedSince(newest)));
    }

    private static List<String> difference(Set<String> from, Set<String> minus) {
        return from.stream().filter(ean -> !minus.contains(ean)).sorted().toList();
    }

    private void batch(String sql, List<Object[]> rows) {
        for (int from = 0; from < rows.size(); from += BATCH) {
            jdbc.batchUpdate(sql, rows.subList(from, Math.min(rows.size(), from + BATCH)));
        }
    }

    private record Archive(String url, LocalDate date) {}

    private Archive latestArchive() throws IOException, InterruptedException {
        try (InputStream body = open(listUrl)) {
            JsonNode archives = json.readTree(body).path("archives");
            if (!archives.isArray() || archives.isEmpty()) throw new IOException("No cijene archives listed");
            JsonNode newest = archives.get(0);
            return new Archive(newest.path("url").asString(), LocalDate.parse(newest.path("date").asString()));
        }
    }

    private InputStream open(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("User-Agent", "Disscount/1.0 (https://disscount.me)")
                .timeout(Duration.ofSeconds(60))
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
