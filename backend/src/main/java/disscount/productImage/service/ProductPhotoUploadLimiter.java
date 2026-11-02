package disscount.productImage.service;

import java.time.Clock;
import java.util.UUID;

import disscount.util.FixedWindowLimiter;
import org.springframework.stereotype.Component;

/** Product photos are public, so the cap is tighter than for private card photos; admins skip it. */
@Component
public class ProductPhotoUploadLimiter {

    static final int MAX_UPLOADS = 10;
    static final long WINDOW_MILLIS = 10 * 60_000;

    private final FixedWindowLimiter limiter =
            new FixedWindowLimiter(MAX_UPLOADS, WINDOW_MILLIS, "error.productImage.rateLimited", Clock.systemUTC());

    public void check(UUID userId) {
        limiter.check(userId);
    }

    public void sweep() {
        limiter.sweep();
    }
}
