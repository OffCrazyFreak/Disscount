package disscount.shared;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Zone-less columns and no pinned TZ, so a bare LocalDateTime.now() could jumble updatedAt; the frontend reads UTC. */
public final class Timestamps {

    private Timestamps() {}

    public static LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
