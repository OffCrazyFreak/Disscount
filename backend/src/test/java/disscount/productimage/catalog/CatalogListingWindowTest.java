package disscount.productimage.catalog;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import disscount.productimage.ProductImageSet;
import disscount.productimage.ProductImageSetRepository;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/** Daily archives miss whole chains on some days, so a product drops out only after 14 archives without a price. */
// Tests roll back so their recount never touches other tests' rows; on methods, as a class annotation splits the context.
@MigratedPostgres
class CatalogListingWindowTest extends FullStackTest {

    static final String MILK = "3850102101017";
    static final String KONZUM_ONLY = "3850102101024";
    static final String UNPRICED = "3850102101031";
    static final String LEGACY = "3850102101048";

    @Autowired CatalogStore store;
    @Autowired ProductImageSetRepository sets;
    @Autowired JdbcTemplate jdbc;

    // Later than any committed row, so the window counts back from these rows alone.
    final LocalDate today = LocalDate.now(ZoneOffset.UTC).plusYears(10);

    static CatalogArchiveReader.Entry priced(String name, Map<String, Integer> pricesByChain) {
        return new CatalogArchiveReader.Entry(name, null, pricesByChain, null, null);
    }

    @Test
    @Transactional
    void aProductMissingFromOneArchiveStaysListedWithTheChainsOfTheWholeWindow() throws Exception {
        CatalogImportResult first = store.store(Map.of(
                MILK, priced("MLIJEKO", Map.of("spar", 3)),
                KONZUM_ONLY, priced("KONZUM SIR", Map.of("konzum", 2)),
                UNPRICED, priced("BEZ CIJENE", Map.of())), today.minusDays(1));

        assertThat(first.newlyListed()).contains(MILK, KONZUM_ONLY).doesNotContain(UNPRICED);

        CatalogImportResult second = store.store(Map.of(MILK, priced("MLIJEKO", Map.of("lidl", 4))), today);

        assertThat(second.droppedOut()).doesNotContain(KONZUM_ONLY);
        assertThat(second.newlyListed()).doesNotContain(MILK);
        assertThat(listedEans()).contains(MILK, KONZUM_ONLY).doesNotContain(UNPRICED);
        // Spar was quiet today, yet still priced milk inside the window.
        assertThat(counts(MILK)).containsExactly(2, 7);
        assertThat(counts(KONZUM_ONLY)).containsExactly(1, 2);
    }

    @Test
    @Transactional
    void theWindowIsTheNewestArchiveAndTheThirteenDaysBeforeIt() throws Exception {
        store.store(Map.of(MILK, priced("MLIJEKO", Map.of("spar", 3))), today.minusDays(13));
        store.store(Map.of(KONZUM_ONLY, priced("KONZUM SIR", Map.of("konzum", 2))), today.minusDays(14));

        CatalogImportResult result = store.store(Map.of(UNPRICED, priced("NOVO", Map.of("spar", 1))), today);

        assertThat(result.droppedOut()).contains(KONZUM_ONLY).doesNotContain(MILK);
        assertThat(result.newlyListed()).contains(UNPRICED);
        assertThat(listedEans()).contains(MILK, UNPRICED).doesNotContain(KONZUM_ONLY);
        // Out of the window, so it sinks to the bottom of every queue ordered by these counts.
        assertThat(counts(KONZUM_ONLY)).containsExactly(0, 0);
    }

    @Test
    @Transactional
    void aChainRowOlderThanTheWindowIsDeletedAndStopsCounting() {
        store.store(Map.of(MILK, priced("MLIJEKO", Map.of("spar", 3)),
                KONZUM_ONLY, priced("KONZUM SIR", Map.of("konzum", 2))), today.minusDays(14));
        assertThat(chainRows()).isEqualTo(2);

        store.store(Map.of(MILK, priced("MLIJEKO", Map.of("konzum", 2))), today);

        // Spar priced milk only on the day before the window, so only Konzum counts.
        assertThat(counts(MILK)).containsExactly(1, 2);
        assertThat(chainRows()).isEqualTo(1);
    }

    @Test
    @Transactional
    void untilTheChainRowsSpanTheWindowTheyRaiseCountsButNeverLowerThem() {
        jdbc.update("""
                insert into app.product_image_set (ean, name, store_listings, chain_count, last_seen_on, pinned, needs_review)
                values (?, 'STARI SIR', 40, 4, ?, false, false)
                """, LEGACY, today.minusDays(1));

        store.store(Map.of(LEGACY, priced("STARI SIR", Map.of("konzum", 5)), MILK, priced("MLIJEKO", Map.of("spar", 3))),
                today);

        // The four chains came from a full archive before deploy, so one chain seen since then does not lower them.
        assertThat(counts(LEGACY)).containsExactly(4, 40);
        assertThat(counts(MILK)).containsExactly(1, 3);

        jdbc.update("insert into app.product_chain_listing (ean, chain, store_listings, last_seen_on) values (?, 'spar', 1, ?)",
                UNPRICED, today.minusDays(13));
        store.store(Map.of(LEGACY, priced("STARI SIR", Map.of("konzum", 5))), today);

        assertThat(counts(LEGACY)).containsExactly(1, 5);
    }

    @Test
    @Transactional
    void anOlderArchiveDoesNotMoveTheLastSeenDateBack() {
        store.store(Map.of(MILK, priced("MLIJEKO", Map.of("spar", 3))), today);
        store.store(Map.of(MILK, priced("MLIJEKO", Map.of("spar", 9))), today.minusDays(5));

        assertThat(jdbc.queryForObject("select last_seen_on from app.product_image_set where ean = ?",
                LocalDate.class, MILK)).isEqualTo(today);
        assertThat(counts(MILK)).containsExactly(1, 3);
    }

    @Test
    @Transactional
    void aDayWithoutSignalKeepsThePlaceButNewRulesReplaceIt() {
        store.store(Map.of(MILK, new CatalogArchiveReader.Entry("MLIJEKO", null, Map.of("spar", 3), "hrana", "mlijeko")),
                today);
        store.store(Map.of(MILK, priced("ML.", Map.of("spar", 3))), today);

        assertThat(place(MILK)).containsExactly("hrana", "mlijeko");

        jdbc.update("update app.product_image_set set taxonomy_version = 'older-rules' where ean = ?", MILK);
        store.store(Map.of(MILK, priced("ML.", Map.of("spar", 3))), today);

        assertThat(place(MILK)).containsExactly(null, null);
    }

    @Test
    @Transactional
    void aNewDepartmentKeepsTheStoredCategoryOnlyWhereTheCategoryAllowsIt() {
        store.store(Map.of(MILK, new CatalogArchiveReader.Entry("MLIJEKO", null, Map.of("spar", 3), "hrana", "mlijeko")),
                today);

        store.store(Map.of(MILK, new CatalogArchiveReader.Entry("ML.", null, Map.of("spar", 3), "pice", null)), today);
        assertThat(place(MILK)).containsExactly("pice", "mlijeko");

        store.store(Map.of(MILK, new CatalogArchiveReader.Entry("ML.", null, Map.of("spar", 3), "kozmetika", null)), today);
        assertThat(place(MILK)).containsExactly("kozmetika", null);
    }

    @Test
    @Transactional
    void aPhotoOrAdminSaveOfARowLoadedBeforeTheImportKeepsWhatTheImportWrote() {
        store.store(Map.of(MILK, priced("MLIJEKO", Map.of("spar", 3))), today.minusDays(1));
        ProductImageSet stale = sets.findById(MILK).orElseThrow();

        store.store(Map.of(MILK, new CatalogArchiveReader.Entry("MLIJEKO", null, Map.of("spar", 3, "lidl", 4), "hrana",
                "mlijeko")), today);
        stale.setNeedsReview(true);
        sets.saveAndFlush(stale);

        assertThat(counts(MILK)).containsExactly(2, 7);
        assertThat(place(MILK)).containsExactly("hrana", "mlijeko");
        assertThat(jdbc.queryForObject("select last_seen_on from app.product_image_set where ean = ?", LocalDate.class, MILK))
                .isEqualTo(today);
        assertThat(jdbc.queryForObject("select needs_review from app.product_image_set where ean = ?", Boolean.class, MILK))
                .isTrue();
    }

    private int chainRows() {
        return jdbc.queryForObject("select count(*) from app.product_chain_listing where ean in (?, ?, ?, ?)", Integer.class,
                MILK, KONZUM_ONLY, UNPRICED, LEGACY);
    }

    private List<Integer> counts(String ean) {
        return jdbc.queryForObject("select chain_count, store_listings from app.product_image_set where ean = ?",
                (row, i) -> List.of(row.getInt(1), row.getInt(2)), ean);
    }

    private List<String> place(String ean) {
        return jdbc.queryForObject("select department, category from app.product_image_set where ean = ?",
                (row, i) -> Arrays.asList(row.getString(1), row.getString(2)), ean);
    }

    private List<String> listedEans() throws Exception {
        ResultActions result = mvc.perform(get("/api/products/catalog/eans"));
        return json.readerForListOf(String.class).readValue(body(result).path("eans"));
    }
}
