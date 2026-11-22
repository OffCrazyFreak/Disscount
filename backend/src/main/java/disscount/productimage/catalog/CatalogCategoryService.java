package disscount.productimage.catalog;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import disscount.productimage.catalog.CatalogCategoryDtos.CatalogCategoriesDto;
import disscount.productimage.catalog.CatalogCategoryDtos.CatalogCategoryDto;
import disscount.productimage.catalog.CatalogCategoryDtos.CatalogDepartmentDto;
import disscount.productimage.catalog.CatalogCategoryDtos.CategoryProductDto;
import disscount.productimage.catalog.CatalogCategoryDtos.ProductCategoryDto;
import disscount.shared.CanonicalBarcode;
import disscount.shared.PageDto;
import disscount.shared.errors.BadRequestException;
import disscount.shared.errors.NotFoundException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class CatalogCategoryService {

    private final JdbcTemplate jdbc;
    private final CatalogTaxonomy taxonomy = CatalogTaxonomy.standard();

    CatalogCategoryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Every department and category in the taxonomy's order, empty ones included, so the hubs never reorder. */
    public CatalogCategoriesDto categories() {
        LocalDate since = listedSince();
        Map<String, Long> byDepartment = counts("department", since);
        Map<String, Long> byCategory = counts("category", since);

        List<CatalogDepartmentDto> departments = taxonomy.departments().stream()
                .map(d -> new CatalogDepartmentDto(d.slug(), byDepartment.getOrDefault(d.slug(), 0L)))
                .toList();
        List<CatalogCategoryDto> categories = taxonomy.categories().stream()
                .map(c -> new CatalogCategoryDto(c.slug(), c.department(), byCategory.getOrDefault(c.slug(), 0L)))
                .toList();
        return new CatalogCategoriesDto(departments, categories);
    }

    /** Most widely sold first; people keeping it on their lists count like one more chain. */
    public PageDto<CategoryProductDto> products(String slug, Pageable page) {
        if (taxonomy.category(slug).isEmpty()) throw new NotFoundException("error.catalog.categoryNotFound");

        LocalDate since = listedSince();
        long total = jdbc.queryForObject(
                "select count(*) from app.product_image_set where category = ? and last_seen_on >= ?",
                Long.class, slug, since);
        List<CategoryProductDto> items = jdbc.query("""
                        select ean, name, brand from app.product_image_set
                        where category = ? and last_seen_on >= ?
                        order by chain_count + list_uses desc, store_listings desc, ean
                        limit ? offset ?
                        """,
                (row, i) -> new CategoryProductDto(row.getString("ean"), row.getString("name"), row.getString("brand")),
                slug, since, page.getPageSize(), page.getOffset());
        return PageDto.from(new PageImpl<>(items, page, total));
    }

    public ProductCategoryDto categoryOf(String requestedEan) {
        if (!Barcodes.isEanShape(requestedEan)) throw new BadRequestException("error.productImage.invalidEan");

        String ean = CanonicalBarcode.of(requestedEan);
        return jdbc.query("select department, category from app.product_image_set where ean = ?",
                        (row, i) -> new ProductCategoryDto(ean, row.getString("department"), row.getString("category")),
                        ean)
                .stream()
                .findFirst()
                .orElseThrow(() -> new NotFoundException("error.catalog.productNotFound"));
    }

    // Before the first import there is no window, so a date no row reaches keeps every list empty.
    private static final LocalDate NOTHING_LISTED = LocalDate.of(9999, 12, 31);

    private LocalDate listedSince() {
        LocalDate newest = jdbc.queryForObject("select max(last_seen_on) from app.product_image_set", LocalDate.class);
        return newest == null ? NOTHING_LISTED : CatalogListing.listedSince(newest);
    }

    private Map<String, Long> counts(String column, LocalDate since) {
        Map<String, Long> counts = new HashMap<>();
        jdbc.query("select " + column + " as slug, count(*) as products from app.product_image_set "
                        + "where last_seen_on >= ? and " + column + " is not null group by " + column,
                (RowCallbackHandler) row -> counts.put(row.getString("slug"), row.getLong("products")),
                since);
        return counts;
    }
}
