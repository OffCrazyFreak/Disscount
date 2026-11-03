package disscount.productImage.off;

import java.util.Set;

/** Open Food Facts refused or failed one image download; a later try may work, so it is not given up like a gone one. */
public class OffImageUnavailableException extends IllegalStateException {

    // Rate limiting and gateway outages hit every download alike, so they must pause the whole queue.
    private static final Set<Integer> QUEUE_WIDE = Set.of(429, 502, 503, 504);

    private final int status;

    public OffImageUnavailableException(String url, int status) {
        super(url + " answered " + status);
        this.status = status;
    }

    public boolean concernsThisImageOnly() {
        return !QUEUE_WIDE.contains(status);
    }
}
