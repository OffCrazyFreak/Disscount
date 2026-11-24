package disscount.shared.errors;

import disscount.config.SentryReleaseConfig;
import io.sentry.ITransportFactory;
import io.sentry.NoOpTransportFactory;
import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import io.sentry.spring.boot4.SentryAutoConfiguration;
import io.sentry.spring.boot4.SentryLogbackAppenderAutoConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        classes = {GlobalExceptionHandler.class, SentryReleaseConfig.class, GlobalExceptionHandlerSentryTest.CapturedEvents.class},
        properties = {"sentry.dsn=https://key@sentry.invalid/1", "GIT_SHA=0123abcd"})
@ImportAutoConfiguration({SentryAutoConfiguration.class, SentryLogbackAppenderAutoConfiguration.class})
class GlobalExceptionHandlerSentryTest {

    @TestConfiguration
    static class CapturedEvents {
        final List<SentryEvent> events = new CopyOnWriteArrayList<>();

        @Bean
        SentryOptions.BeforeSendCallback recordEvent() {
            return (event, hint) -> {
                events.add(event);
                return event;
            };
        }

        // Keeps the test inside the module: events are recorded, never sent.
        @Bean
        ITransportFactory noTransport() {
            return NoOpTransportFactory.getInstance();
        }
    }

    @Autowired GlobalExceptionHandler handler;
    @Autowired CapturedEvents captured;

    @BeforeEach
    void forgetEarlierEvents() {
        captured.events.clear();
    }

    @Test
    void anUnhandledExceptionTurnedInto500IsReportedWithTheCommitAsRelease() {
        IllegalStateException failure = new IllegalStateException("boom");

        assertThat(handler.handleGenericException(failure).getStatus()).isEqualTo(500);

        assertThat(captured.events).singleElement().satisfies(event -> {
            assertThat(event.getThrowable()).isSameAs(failure);
            assertThat(event.getRelease()).isEqualTo("0123abcd");
        });
    }

    @Test
    void aWarningIsNotReported() {
        LoggerFactory.getLogger(GlobalExceptionHandlerSentryTest.class).warn("expected client error");

        assertThat(captured.events).isEmpty();
    }
}
