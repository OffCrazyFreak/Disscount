package disscount.util;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * The one place "now" is read.
 *
 * <p>The columns are zone-less, so a bare {@code LocalDateTime.now()} stamps them in
 * whatever zone the container happens to run in. Nothing pins TZ for the backend
 * image, and shopping-list ordering is load-bearing on updatedAt, so a base-image
 * change moving from UTC to Europe/Zagreb would shift rows by an hour against
 * their neighbours and jumble the order for good. Europe/Zagreb also repeats the
 * 02:00 hour every autumn.
 *
 * <p>Every zone-less column goes through here, including the audited ones: JpaConfig
 * points Spring Data's DateTimeProvider at this method rather than its default, which
 * would otherwise read the JVM zone. The frontend parses these values as UTC, so a
 * stamp taken in any other zone would render an hour or two off.
 */
public final class Timestamps {

    private Timestamps() {}

    public static LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
