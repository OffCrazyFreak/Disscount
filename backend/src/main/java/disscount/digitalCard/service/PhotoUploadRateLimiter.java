package disscount.digitalCard.service;

import org.springframework.stereotype.Component;

import disscount.exceptions.TooManyRequestsException;

import java.time.Clock;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Per-instance fixed window; photo uploads are the one expensive write, so this stays in memory. */
@Component
public class PhotoUploadRateLimiter {

    static final int MAX_UPLOADS = 20;
    static final long WINDOW_MILLIS = 60_000;

    private record Window(long startedAt, int count) {}

    private final ConcurrentHashMap<UUID, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    public PhotoUploadRateLimiter() {
        this(Clock.systemUTC());
    }

    PhotoUploadRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public void check(UUID userId) {
        long now = clock.millis();
        long[] retryAfterMillis = {0};

        windows.compute(userId, (id, window) -> {
            if (window == null || now - window.startedAt() >= WINDOW_MILLIS) {
                return new Window(now, 1);
            }
            if (window.count() >= MAX_UPLOADS) {
                retryAfterMillis[0] = WINDOW_MILLIS - (now - window.startedAt());
                return window;
            }
            return new Window(window.startedAt(), window.count() + 1);
        });

        if (retryAfterMillis[0] > 0) {
            long seconds = Math.max(1, (retryAfterMillis[0] + 999) / 1000);
            throw new TooManyRequestsException("Previše učitavanja slika, pokušaj ponovno za malo", seconds);
        }
    }

    public void sweep() {
        long now = clock.millis();
        windows.entrySet().removeIf(e -> now - e.getValue().startedAt() >= WINDOW_MILLIS);
    }
}
