package disscount.productimage;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import disscount.productimage.ProductImageDtos.ListedEansDto;
import disscount.productimage.ProductImageDtos.ProductImagesDto;
import disscount.productimage.ProductImageDtos.ProductThumbnailsDto;
import disscount.productimage.catalog.Barcodes;
import disscount.shared.errors.BadRequestException;
import disscount.shared.photo.PhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ProductImageQueryService {

    static final int MAX_THUMBNAIL_EANS = 100;

    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS)
    private final PhotoStore store;
    private final ProductImageViews views;

    public ProductImagesDto forProduct(String ean) {
        requireEan(ean);
        if (!store.enabled()) return new ProductImagesDto(ean, List.of());

        UUID mainId = sets.findById(ean).map(ProductImageSet::getMainImageId).orElse(null);
        return views.publicView(ean, mainId, images.findByEanOrderByCreatedAtAsc(ean));
    }

    public ProductThumbnailsDto thumbnails(List<String> eans) {
        Set<String> unique = new LinkedHashSet<>(eans);
        if (unique.size() > MAX_THUMBNAIL_EANS) {
            throw new BadRequestException("error.productImage.tooManyEans", String.valueOf(MAX_THUMBNAIL_EANS));
        }
        // One bad code in a search page should cost that product its thumbnail, not the whole page.
        unique.removeIf(ean -> !Barcodes.isEanShape(ean));
        if (unique.isEmpty() || !store.enabled()) return new ProductThumbnailsDto(Map.of());

        Map<String, String> result = new HashMap<>();
        for (ProductImage image : images.findShownMainImages(unique, List.of(ImageStatus.VERIFIED, ImageStatus.PENDING))) {
            result.put(image.getEan(), store.publicUrl(image.listKey()));
        }
        return new ProductThumbnailsDto(result);
    }

    public ListedEansDto listedEans() {
        return new ListedEansDto(sets.findListedEans());
    }

    static void requireEan(String ean) {
        if (!Barcodes.isEanShape(ean)) {
            throw new BadRequestException("error.productImage.invalidEan");
        }
    }
}
