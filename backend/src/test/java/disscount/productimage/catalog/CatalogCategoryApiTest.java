package disscount.productimage.catalog;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import disscount.support.ApiContract;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Tests roll back so their recount never touches other tests' rows; on methods, as a class annotation splits the context.
@MigratedPostgres
class CatalogCategoryApiTest extends FullStackTest {

    static final String WIDE = "3850102101109";
    static final String NARROW = "3850102101116";
    static final String ON_LISTS = "3850102101123";
    static final String UNSORTED = "3850102101130";

    @Autowired CatalogStore importer;
    @Autowired JdbcTemplate jdbc;

    final LocalDate today = LocalDate.now(ZoneOffset.UTC);

    /** Priced in the first n chains, with the given store prices in each. */
    static CatalogArchiveReader.Entry milk(int chains, int pricesPerChain) {
        Map<String, Integer> prices = new HashMap<>();
        List.of("konzum", "spar", "lidl", "plodine", "studenac").subList(0, chains)
                .forEach(chain -> prices.put(chain, pricesPerChain));
        return new CatalogArchiveReader.Entry("MLIJEKO TRAJNO " + chains, "DUKAT", prices, "hrana", "mlijeko");
    }

    private void putOnAShoppingList(String ean) {
        UUID list = UUID.randomUUID();
        UUID owner = newUser("shopper").getId();
        // The user is saved through JPA, so it reaches the table only at a flush.
        entityManager.flush();
        jdbc.update("insert into app.shopping_list (id, created_at, title, updated_at, owner_id) values (?, now(), 'Tjedno', now(), ?)",
                list, owner);
        jdbc.update("""
                insert into app.shopping_list_item (id, amount, created_at, ean, is_checked, name, updated_at, shopping_list_id)
                values (gen_random_uuid(), 1, now(), ?, false, 'Mlijeko', now(), ?)
                """, ean, list);
    }

    @Test
    @Transactional
    void categoryPagesLeadWithTheMostWidelySoldAndTheMostListedProducts() throws Exception {
        putOnAShoppingList(ON_LISTS);
        // An item saved before codes were stored without their leading zeros still counts for the product.
        putOnAShoppingList("0" + ON_LISTS);

        importer.store(Map.of(WIDE, milk(5, 1), NARROW, milk(3, 50), ON_LISTS, milk(2, 1),
                UNSORTED, new CatalogArchiveReader.Entry("NEŠTO", null, Map.of("spar", 1), null, null)), today);

        JsonNode page = body(mvc.perform(get("/api/products/categories/mlijeko/products").param("size", "100"))
                .andExpect(status().isOk()));
        ApiContract.assertMatches("PageDtoCategoryProductDto", page);

        // ON_LISTS sells in fewer chains than NARROW, but two people keep it on their lists.
        assertThat(page.path("items").findValuesAsString("ean")).containsSubsequence(WIDE, ON_LISTS, NARROW);
        assertThat(page.path("items").findValuesAsString("ean")).doesNotContain(UNSORTED);
    }

    @Test
    @Transactional
    void theCategoryListCountsListedProductsInTaxonomyOrder() throws Exception {
        importer.store(Map.of(WIDE, milk(5, 1)), today);

        JsonNode categories = body(mvc.perform(get("/api/products/categories")).andExpect(status().isOk()));
        ApiContract.assertMatches("CatalogCategoriesDto", categories);

        assertThat(categories.path("departments").get(0).path("slug").asString()).isEqualTo("hrana");
        JsonNode milkCategory = categories.path("categories").valueStream()
                .filter(c -> c.path("slug").asString().equals("mlijeko")).findFirst().orElseThrow();
        assertThat(milkCategory.path("department").asString()).isEqualTo("hrana");
        assertThat(milkCategory.path("productCount").asLong()).isPositive();
    }

    @Test
    @Transactional
    void aProductPageCanAskForItsBreadcrumb() throws Exception {
        importer.store(Map.of(WIDE, milk(5, 1)), today);

        JsonNode crumb = body(mvc.perform(get("/api/products/0" + WIDE + "/category")).andExpect(status().isOk()));
        ApiContract.assertMatches("ProductCategoryDto", crumb);
        assertThat(crumb.path("ean").asString()).isEqualTo(WIDE);
        assertThat(crumb.path("category").asString()).isEqualTo("mlijeko");

        mvc.perform(get("/api/products/3850102109990/category")).andExpect(status().isNotFound());
        mvc.perform(get("/api/products/not-an-ean/category")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/products/categories/nepostojeca/products")).andExpect(status().isNotFound());
    }
}
