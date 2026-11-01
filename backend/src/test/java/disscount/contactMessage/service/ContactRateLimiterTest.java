package disscount.contactMessage.service;

import disscount.exceptions.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ContactRateLimiterTest {

    private static final String IP = "93.140.10.20";

    private Instant now = Instant.parse("2026-11-02T10:00:00Z");
    private final ContactRateLimiter limiter = new ContactRateLimiter(new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    });

    private void sendTimes(int times) {
        for (int i = 0; i < times; i++) limiter.check(IP);
    }

    @Test
    void allowsFiveAnHourThenRefusesWithTheWaitUntilTheOldestExpires() {
        sendTimes(5);
        now = now.plus(Duration.ofMinutes(10));

        assertThatThrownBy(() -> limiter.check(IP))
                .isInstanceOfSatisfying(TooManyRequestsException.class, ex -> {
                    assertThat(ex.getMessage()).isEqualTo("error.contactMessage.rateLimited");
                    assertThat(ex.getRetryAfterSeconds()).isEqualTo(Duration.ofMinutes(50).toSeconds());
                });
    }

    @Test
    void aRefusedAttemptDoesNotExtendTheWait() {
        sendTimes(5);
        assertThatThrownBy(() -> limiter.check(IP)).isInstanceOf(TooManyRequestsException.class);

        now = now.plus(Duration.ofHours(1));
        assertThatCode(() -> limiter.check(IP)).doesNotThrowAnyException();
    }

    @Test
    void capsTwentyADayEvenWhenEachHourStaysUnderFive() {
        for (int hour = 0; hour < 4; hour++) {
            sendTimes(5);
            now = now.plus(Duration.ofHours(1));
        }

        assertThatThrownBy(() -> limiter.check(IP))
                .isInstanceOfSatisfying(TooManyRequestsException.class, ex ->
                        assertThat(ex.getRetryAfterSeconds()).isEqualTo(Duration.ofHours(20).toSeconds()));
    }

    @Test
    void countsEachClientSeparately() {
        sendTimes(5);
        assertThatCode(() -> limiter.check("198.51.100.7")).doesNotThrowAnyException();
    }

    @Test
    void sweepForgetsClientsQuietForADay() {
        sendTimes(5);
        now = now.plus(Duration.ofDays(1));
        limiter.sweep();

        assertThat(limiter.trackedClients()).isZero();
    }
}
