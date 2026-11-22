package disscount.productimage.catalog;

import java.time.Duration;

import disscount.productimage.catalog.CatalogCategoryDtos.CatalogCategoriesDto;
import disscount.productimage.catalog.CatalogCategoryDtos.CategoryProductDto;
import disscount.productimage.catalog.CatalogCategoryDtos.ProductCategoryDto;
import disscount.shared.PageDto;
import disscount.shared.Paging;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Product Categories", description = "Departments and everyday categories of the product catalogue")
class CatalogCategoryController {

    // The catalogue changes only when the weekly import runs, so an hour of caching costs nothing.
    private static final CacheControl HOURLY = CacheControl.maxAge(Duration.ofHours(1)).cachePublic();

    private final CatalogCategoryService categories;

    CatalogCategoryController(CatalogCategoryService categories) {
        this.categories = categories;
    }

    @Operation(summary = "Departments and categories with their listed product counts")
    @GetMapping("/categories")
    public ResponseEntity<CatalogCategoriesDto> categories() {
        return ResponseEntity.ok().cacheControl(HOURLY).body(categories.categories());
    }

    @Operation(summary = "Listed products of one category, most widely sold first")
    @GetMapping("/categories/{slug}/products")
    public ResponseEntity<PageDto<CategoryProductDto>> products(@PathVariable String slug,
                                                                @ParameterObject @PageableDefault(size = 24) Pageable page) {
        return ResponseEntity.ok().cacheControl(HOURLY).body(categories.products(slug, Paging.withoutClientSort(page)));
    }

    @Operation(summary = "Department and category of one product, for breadcrumbs")
    @GetMapping("/{ean}/category")
    public ResponseEntity<ProductCategoryDto> categoryOf(@PathVariable String ean) {
        return ResponseEntity.ok().cacheControl(HOURLY).body(categories.categoryOf(ean));
    }
}
