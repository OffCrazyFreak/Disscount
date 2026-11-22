package disscount.productimage.catalog;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

final class CatalogCategoryDtos {

    private CatalogCategoryDtos() {}

    /** Product counts hold listed products only, the ones the sitemap carries. */
    public record CatalogDepartmentDto(String slug, long productCount) {}

    public record CatalogCategoryDto(String slug, String department, long productCount) {}

    public record CatalogCategoriesDto(List<CatalogDepartmentDto> departments, List<CatalogCategoryDto> categories) {}

    public record CategoryProductDto(String ean, @Schema(nullable = true) String name, @Schema(nullable = true) String brand) {}

    /** Both null when no chain and no rule placed the product. */
    public record ProductCategoryDto(String ean, @Schema(nullable = true) String department,
                                     @Schema(nullable = true) String category) {}
}
