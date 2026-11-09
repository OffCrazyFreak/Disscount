package disscount.config;

import java.time.Clock;

import disscount.util.FixedWindowLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Photo uploads are the one write expensive enough to cap; the windows live in memory per instance. */
@Configuration
public class UploadLimitConfig {

    public static final String CARD_PHOTOS = "cardPhotoUploadLimiter";
    public static final String PRODUCT_PHOTOS = "productPhotoUploadLimiter";

    @Bean(CARD_PHOTOS)
    FixedWindowLimiter cardPhotoUploadLimiter() {
        return new FixedWindowLimiter(20, 60_000, "error.cardPhoto.rateLimited", Clock.systemUTC());
    }

    // Product photos are public, so the cap is tighter than for private card photos; admins skip it.
    @Bean(PRODUCT_PHOTOS)
    FixedWindowLimiter productPhotoUploadLimiter() {
        return new FixedWindowLimiter(10, 10 * 60_000, "error.productImage.rateLimited", Clock.systemUTC());
    }
}
