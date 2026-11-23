package disscount.productimage.catalog;

import java.time.LocalDate;
import java.util.List;

/** What one import changed in the listed set, so search engines can hear about new and gone product pages. */
public record CatalogImportResult(LocalDate archiveDate, int products, List<String> newlyListed, List<String> droppedOut) {}
