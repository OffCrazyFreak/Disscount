package disscount.productimage.catalog;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** Tells Bing, Yandex and the other IndexNow engines which product pages appeared or went away (indexnow.org). */
@Component
@EnableConfigurationProperties(IndexNowProperties.class)
class IndexNowClient {

    private static final Logger log = LoggerFactory.getLogger(IndexNowClient.class);

    // The protocol's limit per POST.
    static final int MAX_URLS = 10_000;

    private final IndexNowProperties properties;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    IndexNowClient(IndexNowProperties properties, ObjectMapper json) {
        this.properties = properties;
        this.json = json;
    }

    /** Never throws: a missed ping only means the engines find the change at their next sitemap read. */
    void submit(List<String> eans) {
        if (!properties.enabled() || eans.isEmpty()) return;

        String base = "https://" + properties.host();
        List<String> urls = eans.stream().map(ean -> base + "/products/" + ean).toList();
        try {
            for (int from = 0; from < urls.size(); from += MAX_URLS) {
                if (!post(urls.subList(from, Math.min(urls.size(), from + MAX_URLS)))) return;
            }
        } catch (RuntimeException e) {
            log.warn("IndexNow ping failed; the engines find the change at their next sitemap read", e);
        }
    }

    /** False when the thread was interrupted, so the remaining batches are dropped too. */
    private boolean post(List<String> urls) {
        String body = json.writeValueAsString(Map.of(
                "host", properties.host(),
                "key", properties.key(),
                "keyLocation", "https://" + properties.host() + "/" + properties.key() + ".txt",
                "urlList", urls));

        try {
            int status = send(body);
            if (retryable(status)) {
                Thread.sleep(properties.retryAfter());
                status = send(body);
            }

            if (status == 200 || status == 202) {
                log.info("IndexNow accepted {} product URLs", urls.size());
            } else {
                log.warn("IndexNow answered {} for {} product URLs; they wait for the next sitemap read", status, urls.size());
            }
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private int send(String body) throws InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(properties.endpoint()))
                .header("Content-Type", "application/json; charset=utf-8")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            return http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
        } catch (IOException e) {
            log.warn("IndexNow could not be reached: {}", e.getMessage());
            // Treated like a 503, so a network blip gets the same single retry.
            return 503;
        }
    }

    // 429 is IndexNow's "too many requests"; 400, 403 and 422 mean a bad key or URL, which a retry cannot fix.
    private static boolean retryable(int status) {
        return status == 429 || status >= 500;
    }
}
