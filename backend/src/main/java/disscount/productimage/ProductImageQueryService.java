package disscount.productimage;

import java.util.ArrayList;
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
import disscount.shared.CanonicalBarcode;
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

    public ProductImagesDto forProduct(String requestedEan) {
        String ean = canonicalEan(requestedEan);
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

        // Answered under the spelling each caller asked for, as the caller looks its rows up by it.
        Map<String, List<String>> askedByCanonical = new HashMap<>();
        for (String asked : unique) {
            askedByCanonical.computeIfAbsent(CanonicalBarcode.of(asked), key -> new ArrayList<>()).add(asked);
        }

        Map<String, String> result = new HashMap<>();
        List<ImageStatus> shown = List.of(ImageStatus.VERIFIED, ImageStatus.PENDING);
        for (ProductImage image : images.findShownMainImages(askedByCanonical.keySet(), shown)) {
            String url = store.publicUrl(image.listKey());
            askedByCanonical.getOrDefault(image.getEan(), List.of()).forEach(asked -> result.put(asked, url));
        }
        return new ProductThumbnailsDto(result);
    }

    public ListedEansDto listedEans() {
        return new ListedEansDto(sets.findListedEans());
    }

    /** The one spelling photos are stored under, so a code padded with zeros finds the same photos. */
    static String canonicalEan(String ean) {
        if (!Barcodes.isEanShape(ean)) {
            throw new BadRequestException("error.productImage.invalidEan");
        }
        return CanonicalBarcode.of(ean);
    }
}
