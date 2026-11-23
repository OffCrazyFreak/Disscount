package disscount.productimage.catalog;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Blank key or host switches the pings off, so local and test runs never call search engines. */
@ConfigurationProperties("indexnow")
record IndexNowProperties(
        String key,
        String host,
        @DefaultValue("https://api.indexnow.org/indexnow") String endpoint,
        // Used when a busy engine names no Retry-After of its own.
        @DefaultValue("1m") Duration retryAfter,
        // One run may not outlast this, so a slow engine cannot keep the import thread for hours.
        @DefaultValue("15m") Duration maxRunTime
) {

    boolean enabled() {
        return key != null && !key.isBlank() && host != null && !host.isBlank();
    }
}
