package disscount.productimage.catalog;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.LongSupplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
    static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);

    interface Sleeper {
        void sleep(Duration duration) throws InterruptedException;
    }

    private record Answer(int status, Duration retryAfter) {}

    private final IndexNowProperties properties;
    private final ObjectMapper json;
    private final Sleeper sleeper;
    private final LongSupplier nanoTime;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Autowired
    IndexNowClient(IndexNowProperties properties, ObjectMapper json) {
        this(properties, json, Thread::sleep, System::nanoTime);
    }

    IndexNowClient(IndexNowProperties properties, ObjectMapper json, Sleeper sleeper, LongSupplier nanoTime) {
        this.properties = properties;
        this.json = json;
        this.sleeper = sleeper;
        this.nanoTime = nanoTime;
    }

    /** Never throws: a missed ping only means the engines find the change at their next sitemap read. */
    void submit(List<String> eans) {
        if (!properties.enabled() || eans.isEmpty()) return;

        String base = "https://" + properties.host();
        List<String> urls = eans.stream().map(ean -> base + "/products/" + ean).toList();
        long deadline = nanoTime.getAsLong() + properties.maxRunTime().toNanos();
        try {
            for (int from = 0; from < urls.size(); from += MAX_URLS) {
                List<String> batch = urls.subList(from, Math.min(urls.size(), from + MAX_URLS));
                if (!post(batch, deadline)) {
                    log.warn("IndexNow run stopped; {} product URLs wait for the next sitemap read", urls.size() - from);
                    return;
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (RuntimeException e) {
            log.warn("IndexNow ping failed; the engines find the change at their next sitemap read", e);
        }
    }

    /** False when the rest of the run is pointless: a refused key, a second refusal, or no time left in the run. */
    private boolean post(List<String> urls, long deadline) throws InterruptedException {
        String body = json.writeValueAsString(Map.of(
                "host", properties.host(),
                "key", properties.key(),
                "keyLocation", "https://" + properties.host() + "/" + properties.key() + ".txt",
                "urlList", urls));

        Duration left = remaining(deadline);
        if (!left.isPositive()) return false;

        Answer answer = send(body, left);
        if (retryable(answer.status())) {
            Duration wait = answer.retryAfter() == null ? properties.retryAfter() : answer.retryAfter();
            // Compared as durations, so a huge Retry-After cannot overflow the nanosecond sum.
            if (wait.compareTo(remaining(deadline)) >= 0) return false;

            sleeper.sleep(wait);
            left = remaining(deadline);
            if (!left.isPositive()) return false;

            answer = send(body, left);
            if (retryable(answer.status())) return false;
        }

        if (answer.status() == 200 || answer.status() == 202) {
            log.info("IndexNow accepted {} product URLs", urls.size());
            return true;
        }
        log.warn("IndexNow answered {} for {} product URLs", answer.status(), urls.size());
        // 403 and 422 mean the key or its file is wrong, which every later batch would repeat.
        return answer.status() != 403 && answer.status() != 422;
    }

    private Duration remaining(long deadline) {
        return Duration.ofNanos(deadline - nanoTime.getAsLong());
    }

    /** Waits at most what is left of the run, so a slow engine cannot stretch it past its limit. */
    private Answer send(String body, Duration left) throws InterruptedException {
        Duration timeout = left.compareTo(REQUEST_TIMEOUT) < 0 ? left : REQUEST_TIMEOUT;
        HttpRequest request = HttpRequest.newBuilder(URI.create(properties.endpoint()))
                .header("Content-Type", "application/json; charset=utf-8")
                .timeout(timeout)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<Void> response = http.send(request, HttpResponse.BodyHandlers.discarding());
            return new Answer(response.statusCode(), retryAfter(response.headers().firstValue("Retry-After").orElse(null)));
        } catch (IOException e) {
            log.warn("IndexNow could not be reached: {}", e.getMessage());
            // Treated like a 503, so a network blip gets the same single retry.
            return new Answer(503, null);
        }
    }

    // Only the seconds form; an HTTP date falls back to the configured wait.
    private static Duration retryAfter(String header) {
        if (header == null) return null;
        try {
            return Duration.ofSeconds(Math.max(0, Long.parseLong(header.strip())));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // 429 is IndexNow's "too many requests"; 400, 403 and 422 are a bad request, key or URL, which a retry cannot fix.
    private static boolean retryable(int status) {
        return status == 429 || status >= 500;
    }
}
