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
        @DefaultValue("1m") Duration retryAfter
) {

    boolean enabled() {
        return key != null && !key.isBlank() && host != null && !host.isBlank();
    }
}
