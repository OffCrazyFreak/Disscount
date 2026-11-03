package disscount.productImage.off;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Optional;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import disscount.exceptions.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class OpenFoodFactsClient {

    // Their terms ask every app to identify itself: https://openfoodfacts.github.io/openfoodfacts-server/api/
    static final String USER_AGENT = "Disscount/1.0 (https://disscount.me)";
    static final int MAX_IMAGE_BYTES = 15 * 1024 * 1024;

    // Open Food Facts allows 15 product reads a minute per IP and may ban an IP that goes over.
    static final int PRODUCT_READS_PER_MINUTE = 10;

    private final HttpClient http;
    private final ObjectMapper json;
    private final String apiBase;
    private final String exportUrl;
    private final Clock clock;
    private final Deque<Long> recentProductReads = new ArrayDeque<>();

    public OpenFoodFactsClient(
            ObjectMapper json,
            @Value("${product-images.off.api-base:https://world.openfoodfacts.org}") String apiBase,
            @Value("${product-images.off.export-url:https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz}") String exportUrl) {
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        this.json = json;
        this.apiBase = apiBase;
        this.exportUrl = exportUrl;
        this.clock = Clock.systemUTC();
    }

    /** Empty when the product is unknown there; throws when our own budget for their API is spent. */
    public Optional<OffProductPhotos> fetchPhotos(String ean) {
        reserveProductRead();
        HttpRequest request = request(apiBase + "/api/v2/product/" + ean + "?fields=code,images")
                .timeout(Duration.ofSeconds(20))
                .build();
        try {
            HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
            try (InputStream body = response.body()) {
                if (response.statusCode() == 404) return Optional.empty();
                if (response.statusCode() != 200) {
                    throw new IllegalStateException("Open Food Facts answered " + response.statusCode());
                }
                JsonNode root = json.readTree(body);
                // Jackson 3 throws on a non-numeric status where Jackson 2 read 0; keep treating it as unknown.
                if (root.path("status").asInt(0) != 1) return Optional.empty();
                return Optional.of(OffProductPhotos.parse(root.path("product").path("images")));
            }
        } catch (IOException | JacksonException e) {
            throw new IllegalStateException("Open Food Facts product read failed", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted", e);
        }
    }

    public byte[] download(String url) {
        HttpRequest request = request(url).timeout(Duration.ofSeconds(30)).build();
        try {
            HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
            try (InputStream body = response.body()) {
                if (response.statusCode() == 404 || response.statusCode() == 410) {
                    throw new OffImageGoneException(url, response.statusCode());
                }
                if (response.statusCode() != 200) {
                    throw new IllegalStateException("Image download answered " + response.statusCode());
                }
                byte[] bytes = body.readNBytes(MAX_IMAGE_BYTES + 1);
                if (bytes.length > MAX_IMAGE_BYTES) {
                    throw new OffImageGoneException(url + " is larger than " + MAX_IMAGE_BYTES + " bytes");
                }
                return bytes;
            }
        } catch (IOException e) {
            throw new IllegalStateException("Image download failed", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted", e);
        }
    }

    /** The gzipped tab-separated export of every product, about 1.5 GB; the caller streams and closes it. */
    public InputStream openProductsExport() throws IOException, InterruptedException {
        HttpResponse<InputStream> response =
                http.send(request(exportUrl).timeout(Duration.ofSeconds(60)).build(), HttpResponse.BodyHandlers.ofInputStream());
        if (response.statusCode() != 200) {
            response.body().close();
            throw new IOException("Open Food Facts export answered " + response.statusCode());
        }
        return response.body();
    }

    private synchronized void reserveProductRead() {
        long now = clock.millis();
        while (!recentProductReads.isEmpty() && now - recentProductReads.peekFirst() >= 60_000) {
            recentProductReads.pollFirst();
        }
        if (recentProductReads.size() >= PRODUCT_READS_PER_MINUTE) {
            long retry = Math.max(1, (60_000 - (now - recentProductReads.peekFirst()) + 999) / 1000);
            throw new TooManyRequestsException("error.productImage.offBusy", retry);
        }
        recentProductReads.addLast(now);
    }

    private static HttpRequest.Builder request(String url) {
        return HttpRequest.newBuilder(URI.create(url)).header("User-Agent", USER_AGENT).GET();
    }
}
