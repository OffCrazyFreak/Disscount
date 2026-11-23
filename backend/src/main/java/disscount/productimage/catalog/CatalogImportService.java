package disscount.productimage.catalog;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@EnableConfigurationProperties(CatalogProperties.class)
public class CatalogImportService {

    private static final Logger log = LoggerFactory.getLogger(CatalogImportService.class);
    static final Duration RETRY_FAILED_AFTER = Duration.ofHours(6);

    private final CatalogStore store;
    private final TransactionTemplate tx;
    private final ObjectMapper json;
    private final IndexNowClient indexNow;
    private final String listUrl;
    private final Clock clock;
    private volatile FailedArchive lastFailure;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Autowired
    CatalogImportService(CatalogStore store, TransactionTemplate tx, ObjectMapper json, IndexNowClient indexNow,
                         CatalogProperties properties) {
        this(store, tx, json, indexNow, properties, Clock.systemUTC());
    }

    CatalogImportService(CatalogStore store, TransactionTemplate tx, ObjectMapper json, IndexNowClient indexNow,
                         CatalogProperties properties, Clock clock) {
        this.store = store;
        this.tx = tx;
        this.json = json;
        this.indexNow = indexNow;
        this.listUrl = properties.listUrl();
        this.clock = clock;
    }

    /** Empty while the newest archive upstream is the one imported last, or one that failed in the last 6 hours. */
    public Optional<CatalogImportResult> importNewerThan(LocalDate lastImported) throws IOException, InterruptedException {
        Archive latest = latestArchive();
        // After downtime only the newest date is read; the skipped days only cost the chains that published on them alone.
        if (lastImported != null && !latest.date().isAfter(lastImported)) return Optional.empty();
        if (stillResting(latest.date())) return Optional.empty();

        CatalogImportResult result;
        try {
            result = importArchive(latest);
        } catch (IOException | RuntimeException e) {
            lastFailure = new FailedArchive(latest.date(), clock.instant());
            throw e;
        }
        log.info("Product catalogue imported from {}: {} EANs, {} newly listed, {} dropped out", latest.url(),
                result.products(), result.newlyListed().size(), result.droppedOut().size());
        return Optional.of(result);
    }

    /** Gone pages are pinged too: IndexNow asks for 404s, so the engines drop them sooner. Never throws. */
    public void announce(CatalogImportResult result) {
        indexNow.submit(Stream.concat(result.newlyListed().stream(), result.droppedOut().stream()).toList());
    }

    private record Archive(String url, LocalDate date) {}

    private record FailedArchive(LocalDate date, Instant at) {}

    private CatalogImportResult importArchive(Archive latest) throws IOException, InterruptedException {
        Map<String, CatalogArchiveReader.Entry> catalog;
        try (InputStream archive = open(latest.url())) {
            catalog = CatalogArchiveReader.read(archive);
        }
        return tx.execute(status -> store.store(catalog, latest.date()));
    }

    /** A broken archive would otherwise be downloaded again at every hourly check; a newer date is tried at once. */
    private boolean stillResting(LocalDate newest) {
        FailedArchive failure = lastFailure;
        return failure != null && failure.date().equals(newest)
                && clock.instant().isBefore(failure.at().plus(RETRY_FAILED_AFTER));
    }

    /** The newest archive with a usable date, which stamps every product it prices; a broken entry is skipped. */
    private Archive latestArchive() throws IOException, InterruptedException {
        try (InputStream body = open(listUrl)) {
            JsonNode archives = json.readTree(body).path("archives");
            for (JsonNode archive : archives) {
                String url = archive.path("url").asString("");
                LocalDate date = dateOf(archive);
                if (!url.isBlank() && date != null) return new Archive(url, date);

                log.warn("Skipping cijene archive entry without a URL or a usable date: {}", archive);
            }
            throw new IOException("No usable cijene archive listed");
        }
    }

    private static LocalDate dateOf(JsonNode archive) {
        try {
            return LocalDate.parse(archive.path("date").asString(""));
        } catch (DateTimeParseException e) {
            return null;
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
