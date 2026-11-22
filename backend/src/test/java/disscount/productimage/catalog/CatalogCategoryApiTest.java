package disscount.productimage.catalog;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

import disscount.support.ApiContract;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import disscount.user.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@MigratedPostgres
class CatalogCategoryApiTest extends FullStackTest {

    static final String WIDE = "3850102101109";
    static final String NARROW = "3850102101116";
    static final String ON_LISTS = "3850102101123";
    static final String UNSORTED = "3850102101130";

    @Autowired CatalogImportService importer;
    @Autowired JdbcTemplate jdbc;

    final LocalDate today = LocalDate.now(ZoneOffset.UTC);

    // These rows set the newest archive date, so they must not outlive the test and shift other tests' window.
    @BeforeEach
    @AfterEach
    void forgetTheseProducts() {
        jdbc.update("delete from app.product_image_set where ean in (?, ?, ?, ?)", WIDE, NARROW, ON_LISTS, UNSORTED);
    }

    static CatalogArchiveReader.Entry milk(int chains, int listings) {
        return new CatalogArchiveReader.Entry("MLIJEKO TRAJNO " + chains, "DUKAT", listings, chains, "hrana", "mlijeko");
    }

    @Test
    void categoryPagesLeadWithTheMostWidelySoldAndTheMostListedProducts() throws Exception {
        User shopper = newUser("shopper");
        UUID list = UUID.randomUUID();
        jdbc.update("insert into app.shopping_list (id, created_at, title, updated_at, owner_id) values (?, now(), 'Tjedno', now(), ?)",
                list, shopper.getId());
        jdbc.update("""
                insert into app.shopping_list_item (id, amount, created_at, ean, is_checked, name, updated_at, shopping_list_id)
                values (gen_random_uuid(), 1, now(), ?, false, 'Mlijeko', now(), ?)
                """, ON_LISTS, list);

        importer.store(Map.of(WIDE, milk(5, 10), NARROW, milk(1, 50), ON_LISTS, milk(4, 1),
                UNSORTED, new CatalogArchiveReader.Entry("NEŠTO", null, 1, 1, null, null)), today);

        JsonNode page = body(mvc.perform(get("/api/products/categories/mlijeko/products").param("size", "100"))
                .andExpect(status().isOk()));
        ApiContract.assertMatches("PageDtoCategoryProductDto", page);

        // ON_LISTS sells in four chains and sits on one list, so it ties WIDE and loses only on store listings.
        assertThat(page.path("items").findValuesAsString("ean")).containsSubsequence(WIDE, ON_LISTS, NARROW);
        assertThat(page.path("items").findValuesAsString("ean")).doesNotContain(UNSORTED);
    }

    @Test
    void theCategoryListCountsListedProductsInTaxonomyOrder() throws Exception {
        importer.store(Map.of(WIDE, milk(5, 10)), today);

        JsonNode categories = body(mvc.perform(get("/api/products/categories")).andExpect(status().isOk()));
        ApiContract.assertMatches("CatalogCategoriesDto", categories);

        assertThat(categories.path("departments").get(0).path("slug").asString()).isEqualTo("hrana");
        JsonNode milkCategory = categories.path("categories").valueStream()
                .filter(c -> c.path("slug").asString().equals("mlijeko")).findFirst().orElseThrow();
        assertThat(milkCategory.path("department").asString()).isEqualTo("hrana");
        assertThat(milkCategory.path("productCount").asLong()).isPositive();
    }

    @Test
    void aProductPageCanAskForItsBreadcrumb() throws Exception {
        importer.store(Map.of(WIDE, milk(5, 10)), today);

        JsonNode crumb = body(mvc.perform(get("/api/products/0" + WIDE + "/category")).andExpect(status().isOk()));
        ApiContract.assertMatches("ProductCategoryDto", crumb);
        assertThat(crumb.path("ean").asString()).isEqualTo(WIDE);
        assertThat(crumb.path("category").asString()).isEqualTo("mlijeko");

        mvc.perform(get("/api/products/3850102109990/category")).andExpect(status().isNotFound());
        mvc.perform(get("/api/products/not-an-ean/category")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/products/categories/nepostojeca/products")).andExpect(status().isNotFound());
    }
}
