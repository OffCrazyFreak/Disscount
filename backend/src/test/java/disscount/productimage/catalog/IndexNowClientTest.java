package disscount.productimage.catalog;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
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
    final Deque<Integer> answers = new ArrayDeque<>();
    HttpServer server;

    @BeforeEach
    void startEngine() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/indexnow", exchange -> {
            received.add(json.readTree(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)));
            exchange.sendResponseHeaders(answers.isEmpty() ? 200 : answers.pop(), -1);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stopEngine() {
        server.stop(0);
    }

    IndexNowClient client(String key, String host) {
        String endpoint = "http://127.0.0.1:" + server.getAddress().getPort() + "/indexnow";
        return new IndexNowClient(new IndexNowProperties(key, host, endpoint, Duration.ZERO), json);
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
        List<String> eans = IntStream.range(0, IndexNowClient.MAX_URLS + 1).mapToObj(i -> "38501" + i).toList();

        client("a1b2c3d4e5", "disscount.me").submit(eans);

        assertThat(received).extracting(body -> body.path("urlList").size()).containsExactly(IndexNowClient.MAX_URLS, 1);
    }

    @Test
    void staysSilentUnlessBothKeyAndHostAreSet() {
        client("", "disscount.me").submit(List.of("3850102101017"));
        client("a1b2c3d4e5", null).submit(List.of("3850102101017"));

        assertThat(received).isEmpty();
    }

    @Test
    void retriesOnceWhenTheEngineIsBusyOrDown() {
        answers.addAll(List.of(429, 202));
        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));
        assertThat(received).hasSize(2);

        received.clear();
        answers.addAll(List.of(503, 503));
        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));
        assertThat(received).hasSize(2);
    }

    @Test
    void aRefusedKeyIsLoggedNotRetried() {
        answers.add(403);

        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));

        assertThat(received).hasSize(1);
    }

    @Test
    void anUnreachableEngineNeverThrows() {
        server.stop(0);

        client("a1b2c3d4e5", "disscount.me").submit(List.of("3850102101017"));

        assertThat(received).isEmpty();
    }
}
