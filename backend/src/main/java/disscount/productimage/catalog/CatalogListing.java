package disscount.productimage.catalog;

import java.time.LocalDate;

/** Which products count as on sale: priced in one of the last 14 daily archives, the newest one included. */
public final class CatalogListing {

    // A daily archive holds 20 to 28 of the 29 chains, so one short day must not delist a chain's products.
    public static final int LISTED_FOR_ARCHIVE_DAYS = 14;

    private CatalogListing() {}

    /**
     * Counted back from the newest archive rather than today, so the list changes only when an import runs and an
     * upstream outage cannot empty it. Null when nothing was imported yet.
     */
    public static LocalDate listedSince(LocalDate newestArchive) {
        return newestArchive == null ? null : newestArchive.minusDays(LISTED_FOR_ARCHIVE_DAYS - 1);
    }
}
