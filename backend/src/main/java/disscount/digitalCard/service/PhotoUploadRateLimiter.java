package disscount.digitalCard.service;

import java.time.Clock;
import java.util.UUID;

import disscount.util.FixedWindowLimiter;
import org.springframework.stereotype.Component;

/** Per-instance fixed window; photo uploads are the one expensive write, so this stays in memory. */
@Component
public class PhotoUploadRateLimiter {

    static final int MAX_UPLOADS = 20;
    static final long WINDOW_MILLIS = 60_000;

    private final FixedWindowLimiter limiter;

    public PhotoUploadRateLimiter() {
        this(Clock.systemUTC());
    }

    PhotoUploadRateLimiter(Clock clock) {
        this.limiter = new FixedWindowLimiter(MAX_UPLOADS, WINDOW_MILLIS, "error.cardPhoto.rateLimited", clock);
    }

    public void check(UUID userId) {
        limiter.check(userId);
    }

    public void sweep() {
        limiter.sweep();
    }
}
