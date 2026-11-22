package disscount.productimage.catalog;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/** Daily archives miss whole chains on some days, so a product drops out only after the listing window. */
@MigratedPostgres
class CatalogListingWindowTest extends FullStackTest {

    static final String MILK = "3850102101017";
    static final String KONZUM_ONLY = "3850102101024";
    static final String UNPRICED = "3850102101031";

    @Autowired CatalogImportService importer;
    @Autowired JdbcTemplate jdbc;

    // Later than any date another test stores, so the window counts back from these rows alone.
    final LocalDate today = LocalDate.now(ZoneOffset.UTC).plusYears(10);

    @BeforeEach
    @AfterEach
    void forgetTheseProducts() {
        jdbc.update("delete from app.product_image_set where ean in (?, ?, ?)", MILK, KONZUM_ONLY, UNPRICED);
    }

    static CatalogArchiveReader.Entry priced(String name, int listings) {
        return new CatalogArchiveReader.Entry(name, null, listings, 1, null, null);
    }

    @Test
    void aProductMissingFromOneArchiveStaysListed() throws Exception {
        CatalogImportResult first = importer.store(Map.of(
                MILK, priced("MLIJEKO", 3), KONZUM_ONLY, priced("KONZUM SIR", 2), UNPRICED, priced("BEZ CIJENE", 0)),
                today.minusDays(1));

        assertThat(first.newlyListed()).contains(MILK, KONZUM_ONLY).doesNotContain(UNPRICED);

        CatalogImportResult second = importer.store(Map.of(MILK, priced("MLIJEKO", 4)), today);

        assertThat(second.droppedOut()).doesNotContain(KONZUM_ONLY);
        assertThat(second.newlyListed()).doesNotContain(MILK);
        assertThat(listedEans()).contains(MILK, KONZUM_ONLY).doesNotContain(UNPRICED);
        assertThat(jdbc.queryForObject("select store_listings from app.product_image_set where ean = ?",
                Integer.class, KONZUM_ONLY)).isEqualTo(2);
    }

    @Test
    void aProductUnseenForFifteenDaysDropsOut() throws Exception {
        importer.store(Map.of(MILK, priced("MLIJEKO", 3), KONZUM_ONLY, priced("KONZUM SIR", 2)), today.minusDays(15));
        jdbc.update("update app.product_image_set set last_seen_on = ? where ean = ?", today.minusDays(14), MILK);
        jdbc.update("update app.product_image_set set last_seen_on = ? where ean = ?", today.minusDays(15), KONZUM_ONLY);

        CatalogImportResult result = importer.store(Map.of(UNPRICED, priced("NOVO", 1)), today);

        assertThat(result.droppedOut()).contains(KONZUM_ONLY).doesNotContain(MILK);
        assertThat(result.newlyListed()).contains(UNPRICED);
        assertThat(listedEans()).contains(MILK, UNPRICED).doesNotContain(KONZUM_ONLY);
    }

    @Test
    void anOlderArchiveDoesNotMoveTheLastSeenDateBack() {
        importer.store(Map.of(MILK, priced("MLIJEKO", 3)), today);
        importer.store(Map.of(MILK, priced("MLIJEKO", 3)), today.minusDays(20));

        assertThat(jdbc.queryForObject("select last_seen_on from app.product_image_set where ean = ?",
                LocalDate.class, MILK)).isEqualTo(today);
    }

    private List<String> listedEans() throws Exception {
        ResultActions result = mvc.perform(get("/api/products/catalog/eans"));
        return json.readerForListOf(String.class).readValue(body(result).path("eans"));
    }
}
