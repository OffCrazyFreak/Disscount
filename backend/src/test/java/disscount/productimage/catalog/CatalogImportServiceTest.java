package disscount.productimage.catalog;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

/** The hourly check reads only the small archive list until upstream lists a date newer than the last import. */
class CatalogImportServiceTest {

    static final LocalDate NEWEST = LocalDate.of(2026, 11, 22);

    final CatalogStore store = mock(CatalogStore.class);
    final AtomicInteger archiveDownloads = new AtomicInteger();
    final AtomicReference<LocalDate> listed = new AtomicReference<>(NEWEST);
    final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-11-23T06:00:00Z"));
    final Clock clock = new Clock() {
        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now.get();
        }
    };
    HttpServer server;

    @BeforeEach
    void startUpstream() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v0/list", exchange -> {
            byte[] list = ("{\"archives\": [{\"url\": \"" + base() + "/archive.zip\", \"date\": \"" + listed.get() + "\"}]}")
                    .getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, list.length);
            exchange.getResponseBody().write(list);
            exchange.close();
        });
        server.createContext("/archive.zip", exchange -> {
            archiveDownloads.incrementAndGet();
            exchange.sendResponseHeaders(404, -1);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stopUpstream() {
        server.stop(0);
    }

    String base() {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    CatalogImportService service() {
        return new CatalogImportService(store, mock(TransactionTemplate.class), JsonMapper.builder().build(),
                mock(IndexNowClient.class), new CatalogProperties(base() + "/v0/list"), clock);
    }

    @Test
    void theDateImportedLastIsNotDownloadedAgain() throws Exception {
        assertThat(service().importNewerThan(NEWEST)).isEmpty();

        assertThat(archiveDownloads).hasValue(0);
        verifyNoInteractions(store);
    }

    @Test
    void aNewerDateIsDownloaded() {
        assertThatThrownBy(() -> service().importNewerThan(NEWEST.minusDays(1))).hasMessageContaining("answered 404");

        assertThat(archiveDownloads).hasValue(1);
    }

    @Test
    void aFirstImportTakesWhateverIsNewest() {
        assertThatThrownBy(() -> service().importNewerThan(null)).hasMessageContaining("answered 404");

        assertThat(archiveDownloads).hasValue(1);
    }

    @Test
    void aFailedDateRestsForSixHoursUnlessANewerOneIsListed() {
        CatalogImportService service = service();
        assertThatThrownBy(() -> service.importNewerThan(null)).hasMessageContaining("answered 404");

        now.set(now.get().plus(CatalogImportService.RETRY_FAILED_AFTER).minusSeconds(1));
        assertThat(importQuietly(service)).isEmpty();
        assertThat(archiveDownloads).hasValue(1);

        now.set(now.get().plusSeconds(1));
        assertThatThrownBy(() -> service.importNewerThan(null)).hasMessageContaining("answered 404");
        assertThat(archiveDownloads).hasValue(2);

        listed.set(NEWEST.plusDays(1));
        assertThatThrownBy(() -> service.importNewerThan(null)).hasMessageContaining("answered 404");
        assertThat(archiveDownloads).hasValue(3);
    }

    private static Optional<CatalogImportResult> importQuietly(CatalogImportService service) {
        try {
            return service.importNewerThan(null);
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }
}
