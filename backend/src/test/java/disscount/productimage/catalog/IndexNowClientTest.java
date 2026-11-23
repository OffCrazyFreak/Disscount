package disscount.productimage.catalog;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class IndexNowClientTest {

    final ObjectMapper json = JsonMapper.builder().build();
    final List<JsonNode> received = new ArrayList<>();
    final Deque<String[]> answers = new ArrayDeque<>();
    final List<Duration> waits = new ArrayList<>();
    // A fake clock: each request costs requestTime, each wait its length, so run limits are tested without waiting.
    final AtomicLong now = new AtomicLong();
    Duration requestTime = Duration.ZERO;
    HttpServer server;

    @BeforeEach
    void startEngine() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/indexnow", exchange -> {
            received.add(json.readTree(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)));
            now.addAndGet(requestTime.toNanos());
            String[] answer = answers.isEmpty() ? new String[] {"200"} : answers.pop();
            if (answer[0].equals("slow")) {
                pause(Duration.ofSeconds(3));
                answer = new String[] {"200"};
            }
            if (answer.length > 1) exchange.getResponseHeaders().add("Retry-After", answer[1]);
            exchange.sendResponseHeaders(Integer.parseInt(answer[0]), -1);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stopEngine() {
        server.stop(0);
    }

    IndexNowClient client(String key, String host) {
        return new IndexNowClient(properties(key, host, Duration.ofMinutes(15)), json, wait -> {
            waits.add(wait);
            now.addAndGet(wait.toNanos());
        }, now::get);
    }

    IndexNowProperties properties(String key, String host, Duration maxRunTime) {
        String endpoint = "http://127.0.0.1:" + server.getAddress().getPort() + "/indexnow";
        return new IndexNowProperties(key, host, endpoint, Duration.ofSeconds(60), maxRunTime);
    }

    private static void pause(Duration duration) {
        try {
            Thread.sleep(duration);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Test
    void sendsProductUrlsWithTheKeyFileOnTheSameHost() {
        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017", "5449000000996"));

        assertThat(received).hasSize(1);
        JsonNode body = received.get(0);
        assertThat(body.path("host").asString()).isEqualTo("disscount.me");
        assertThat(body.path("key").asString()).isEqualTo("a1b2c3d4e5");
        assertThat(body.path("keyLocation").asString()).isEqualTo("https://disscount.me/a1b2c3d4e5.txt");
        assertThat(body.path("urlList").valueStream().map(JsonNode::asString))
                .containsExactly("https://disscount.me/products/3850102101017", "https://disscount.me/products/5449000000996");
    }

    @Test
    void splitsAtTenThousandUrlsPerPost() {
        client("a1b2c3d4e5", "disscount.me").submit(twoBatches());

        assertThat(received).extracting(body -> body.path("urlList").size()).containsExactly(IndexNowClient.MAX_URLS, 1);
    }

    @Test
    void staysSilentUnlessBothKeyAndHostAreSet() {
        client("", "disscount.me").submit(List.of("3850102101017"));
        client("a1b2c3d4e5", null).submit(List.of("3850102101017"));

        assertThat(received).isEmpty();
    }

    @Test
    void retriesOnceAfterTheWaitTheEngineAsksFor() {
        answers.add(new String[] {"429", "7"});

        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));

        assertThat(received).hasSize(2);
        assertThat(waits).containsExactly(Duration.ofSeconds(7));
    }

    @Test
    void aDownEngineGetsTheConfiguredWaitAndOneRetry() {
        answers.add(new String[] {"503"});

        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));

        assertThat(received).hasSize(2);
        assertThat(waits).containsExactly(Duration.ofSeconds(60));
    }

    @Test
    void aSecondRefusalStopsTheRun() {
        answers.addAll(List.of(new String[] {"429", "1"}, new String[] {"429", "1"}));

        client("a1b2c3d4e5", "disscount.me").submit(twoBatches());

        assertThat(received).hasSize(2);
    }

    @Test
    void aRefusedKeyStopsTheRunWithoutRetrying() {
        answers.add(new String[] {"403"});

        client("a1b2c3d4e5", "disscount.me").submit(twoBatches());

        assertThat(received).hasSize(1);
        assertThat(waits).isEmpty();
    }

    @Test
    void aWaitLongerThanTheRunMayTakeStopsTheRun() {
        answers.add(new String[] {"429", "3600"});

        client("a1b2c3d4e5", "disscount.me").submit(twoBatches());

        assertThat(received).hasSize(1);
        assertThat(waits).isEmpty();
    }

    @Test
    void aRejectedUrlListStopsTheRunWithoutRetrying() {
        answers.add(new String[] {"422"});

        client("a1b2c3d4e5", "disscount.me").submit(twoBatches());

        assertThat(received).hasSize(1);
        assertThat(waits).isEmpty();
    }

    @Test
    void aRetryAfterDateFallsBackToTheConfiguredWait() {
        answers.add(new String[] {"429", "Wed, 21 Oct 2026 07:28:00 GMT"});

        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));

        assertThat(received).hasSize(2);
        assertThat(waits).containsExactly(Duration.ofSeconds(60));
    }

    @Test
    void aRetryAfterBeyondAnyClockStopsTheRunInsteadOfOverflowing() {
        // The most seconds a long holds in nanoseconds; added to the clock, the old sum wrapped negative and slept.
        answers.add(new String[] {"429", String.valueOf(Long.MAX_VALUE / 1_000_000_000)});

        client("a1b2c3d4e5", "disscount.me").submit(twoBatches());

        assertThat(received).hasSize(1);
        assertThat(waits).isEmpty();
    }

    @Test
    void noBatchStartsOnceTheRunIsOverItsLimit() {
        requestTime = Duration.ofMinutes(16);

        client("a1b2c3d4e5", "disscount.me").submit(twoBatches());

        assertThat(received).hasSize(1);
    }

    @Test
    void aRetryIsNotSentWhenItsWaitUsesUpTheRestOfTheRun() {
        requestTime = Duration.ofMinutes(14).plusSeconds(30);
        answers.add(new String[] {"429", "30"});

        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));

        assertThat(received).hasSize(1);
        assertThat(waits).isEmpty();
    }

    @Test
    void aSlowEngineIsCutOffWhenTheRunEnds() {
        answers.add(new String[] {"slow"});
        IndexNowClient client = new IndexNowClient(properties("a1b2c3d4e5", "disscount.me", Duration.ofSeconds(1)), json,
                waits::add, System::nanoTime);

        long started = System.nanoTime();
        client.submit(twoBatches());

        assertThat(Duration.ofNanos(System.nanoTime() - started)).isLessThan(Duration.ofMillis(2_500));
        assertThat(received).hasSize(1);
        assertThat(waits).isEmpty();
    }

    private static List<String> twoBatches() {
        return IntStream.range(0, IndexNowClient.MAX_URLS + 1).mapToObj(i -> "38501" + i).toList();
    }

    @Test
    void anUnreachableEngineNeverThrows() {
        server.stop(0);

        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));

        assertThat(received).isEmpty();
    }
}
