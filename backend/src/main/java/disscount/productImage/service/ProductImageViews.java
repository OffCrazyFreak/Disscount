package disscount.productImage.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageSet;
import disscount.productImage.dto.ProductImageDtos.AdminImageDto;
import disscount.productImage.dto.ProductImageDtos.AdminProductDto;
import disscount.productImage.dto.ProductImageDtos.CropDto;
import disscount.productImage.dto.ProductImageDtos.ProductImageDto;
import disscount.productImage.dto.ProductImageDtos.ProductImagesDto;
import disscount.productImage.off.OffImageUrls;
import disscount.storage.PhotoStore;
import disscount.storage.PhotoStoreConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ProductImageViews {

    static final String ORIGINAL_PATH = "/api/admin/product-images/images/%s/original";

    @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS)
    private final PhotoStore store;
    private final ProductImageRendering rendering;

    ProductImagesDto publicView(String ean, UUID mainId, List<ProductImage> all) {
        List<ProductImage> shown = new ArrayList<>(all.stream().filter(i -> MainPicker.isShown(i, mainId)).toList());
        shown.sort(Comparator.comparing((ProductImage i) -> !i.getId().equals(mainId))
                .thenComparing(ProductImage::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        return new ProductImagesDto(ean, shown.stream().map(this::toPublic).toList());
    }

    ProductImageDto toPublic(ProductImage image) {
        String small = image.getSmallKey() != null ? image.getSmallKey() : image.getThumbKey();
        return new ProductImageDto(image.getId(), store.publicUrl(image.getFullKey()), store.publicUrl(image.getThumbKey()),
                store.publicUrl(small), image.getSource().name(), image.getStatus().name());
    }

    AdminProductDto adminView(ProductImageSet set, List<ProductImage> all) {
        List<AdminImageDto> images = all.stream()
                .filter(i -> !i.isDeleted())
                .sorted(Comparator.comparing((ProductImage i) -> !i.getId().equals(set.getMainImageId()))
                        .thenComparing(ProductImageViews::adminRank)
                        .thenComparing(ProductImage::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(i -> toAdmin(i, set.getMainImageId()))
                .toList();
        return new AdminProductDto(set.getEan(), set.getName(), set.getBrand(), set.getStoreListings(), set.getChainCount(),
                set.isPinned(), set.getReviewedAt(), images);
    }

    /** Shown photos first, then what awaits a decision, then raw Open Food Facts shots, hidden last. */
    private static int adminRank(ProductImage image) {
        return switch (image.getStatus()) {
            case VERIFIED -> 0;
            case PENDING -> 1;
            case CANDIDATE -> image.getExternalKey() != null && image.getExternalKey().startsWith("front_") ? 2 : 3;
            case HIDDEN -> 4;
        };
    }

    String previewUrl(ProductImage image) {
        if (image.isRendered()) return store.publicUrl(image.getThumbKey());
        if (image.getSource() == ImageSource.OPEN_FOOD_FACTS) {
            return OffImageUrls.preview(image.getEan(), image.getExternalKey(), image.getExternalRev());
        }
        return null;
    }

    private AdminImageDto toAdmin(ProductImage image, UUID mainId) {
        CropDto crop = image.hasCrop()
                ? new CropDto(image.getCropX(), image.getCropY(), image.getCropWidth(), image.getCropHeight())
                : null;
        String original = image.getSource() == ImageSource.OPEN_FOOD_FACTS
                ? rendering.originalUrl(image)
                : ORIGINAL_PATH.formatted(image.getId());
        return new AdminImageDto(
                image.getId(),
                image.getSource().name(),
                image.getStatus().name(),
                image.getLang(),
                previewUrl(image),
                image.isRendered() ? store.publicUrl(image.getFullKey()) : null,
                original,
                image.isRendered(),
                image.getId().equals(mainId),
                image.getRotation(),
                crop,
                image.getReportCount(),
                image.getCreatedAt());
    }
}
