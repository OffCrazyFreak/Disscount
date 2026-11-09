package disscount.util;

import java.time.Clock;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import disscount.exceptions.TooManyRequestsException;
import org.springframework.scheduling.annotation.Scheduled;

public class FixedWindowLimiter {

    private record Window(long startedAt, int count) {}

    private final ConcurrentHashMap<UUID, Window> windows = new ConcurrentHashMap<>();
    private final int maxPerWindow;
    private final long windowMillis;
    private final String messageCode;
    private final Clock clock;

    public FixedWindowLimiter(int maxPerWindow, long windowMillis, String messageCode, Clock clock) {
        this.maxPerWindow = maxPerWindow;
        this.windowMillis = windowMillis;
        this.messageCode = messageCode;
        this.clock = clock;
    }

    public void check(UUID userId) {
        long now = clock.millis();
        long[] retryAfterMillis = {0};

        windows.compute(userId, (id, window) -> {
            if (window == null || now - window.startedAt() >= windowMillis) {
                return new Window(now, 1);
            }
            if (window.count() >= maxPerWindow) {
                retryAfterMillis[0] = windowMillis - (now - window.startedAt());
                return window;
            }
            return new Window(window.startedAt(), window.count() + 1);
        });

        if (retryAfterMillis[0] > 0) {
            long seconds = Math.max(1, (retryAfterMillis[0] + 999) / 1000);
            throw new TooManyRequestsException(messageCode, seconds);
        }
    }

    // Expired windows would otherwise stay in memory for every user who ever uploaded.
    @Scheduled(fixedDelay = 300_000)
    public void sweep() {
        long now = clock.millis();
        windows.entrySet().removeIf(e -> now - e.getValue().startedAt() >= windowMillis);
    }
}
