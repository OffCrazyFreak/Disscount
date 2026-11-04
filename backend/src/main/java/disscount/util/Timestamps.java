package disscount.util;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** The columns are zone-less, and nothing pins TZ for the image, so a bare LocalDateTime.now() could jumble updatedAt order; the frontend reads these as UTC. */
public final class Timestamps {

    private Timestamps() {}

    public static LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
