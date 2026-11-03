package disscount.productImage.service;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import disscount.exceptions.BadRequestException;
import disscount.productImage.catalog.Barcodes;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageSet;
import disscount.productImage.dto.ProductImageDtos.ListedEansDto;
import disscount.productImage.dto.ProductImageDtos.ProductImagesDto;
import disscount.productImage.dto.ProductImageDtos.ProductThumbnailsDto;
import disscount.productImage.storage.ProductImageStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductImageQueryService {

    static final int MAX_THUMBNAIL_EANS = 100;

    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    private final ProductImageStore store;
    private final ProductImageViews views;

    @Transactional(readOnly = true)
    public ProductImagesDto forProduct(String ean) {
        requireEan(ean);
        if (!store.enabled()) return new ProductImagesDto(ean, List.of());

        UUID mainId = sets.findById(ean).map(ProductImageSet::getMainImageId).orElse(null);
        return views.publicView(ean, mainId, images.findByEanOrderByCreatedAtAsc(ean));
    }

    /** Thumbnail of the main photo per EAN, for search results and lists; EANs without one are left out. */
    @Transactional(readOnly = true)
    public ProductThumbnailsDto thumbnails(List<String> eans) {
        Set<String> unique = new LinkedHashSet<>(eans);
        if (unique.size() > MAX_THUMBNAIL_EANS) {
            throw new BadRequestException("error.productImage.tooManyEans", String.valueOf(MAX_THUMBNAIL_EANS));
        }
        unique.forEach(ProductImageQueryService::requireEan);
        if (unique.isEmpty() || !store.enabled()) return new ProductThumbnailsDto(Map.of());

        Map<String, String> result = new HashMap<>();
        for (ProductImage image : images.findShownMainImages(unique, List.of(ImageStatus.VERIFIED, ImageStatus.PENDING))) {
            result.put(image.getEan(), store.publicUrl(image.getThumbKey()));
        }
        return new ProductThumbnailsDto(result);
    }

    /** Products currently on sale somewhere, for the public product sitemap. */
    @Transactional(readOnly = true)
    public ListedEansDto listedEans() {
        return new ListedEansDto(sets.findListedEans());
    }

    static void requireEan(String ean) {
        if (!Barcodes.isEanShape(ean)) {
            throw new BadRequestException("error.productImage.invalidEan");
        }
    }
}
