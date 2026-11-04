package disscount.productImage.service;

import java.io.IOException;
import java.util.UUID;

import disscount.config.UploadLimitConfig;
import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.ValidatedPhoto;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.ServiceUnavailableException;
import disscount.productImage.dao.ProductImageReportRepository;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageReport;
import disscount.productImage.domain.ProductImageSet;
import disscount.productImage.dto.ProductImageDtos.ProductImagesDto;
import disscount.productImage.render.ProductImageRenderer;
import disscount.storage.PhotoStore;
import disscount.storage.PhotoStoreConfig;
import disscount.user.service.UserService;
import disscount.util.FixedWindowLimiter;
import disscount.util.Timestamps;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProductImageWriteService {

    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    private final ProductImageReportRepository reports;
    @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS)
    private final PhotoStore store;
    @Qualifier(PhotoStoreConfig.PRODUCT_ORIGINALS)
    private final PhotoStore originals;
    private final PhotoValidator validator;
    @Qualifier(UploadLimitConfig.PRODUCT_PHOTOS)
    private final FixedWindowLimiter limiter;
    private final ProductImageRendering rendering;
    private final ProductImageRemoval removal;
    private final ProductImageViews views;
    private final UserService userService;

    /** It confirms another user's unconfirmed photo of the same product, since two people photographed what one barcode page showed. */
    @Transactional
    public ProductImagesDto upload(UUID userId, String ean, MultipartFile file) {
        ProductImageQueryService.requireEan(ean);
        requireStorage();
        userService.lockActive(userId);

        boolean admin = userService.isActiveAdmin(userId);
        if (!admin) limiter.check(userId);

        ValidatedPhoto photo = validator.validate(bytes(file));
        // The renderer reads JPEG and PNG only; the app always sends JPEG for product photos.
        if (!"image/jpeg".equals(photo.contentType())) {
            throw new BadRequestException("error.productImage.jpegOnly");
        }
        removal.requireNotDeleted(photo.bytes());

        ProductImageSet set = sets.findById(ean).orElseGet(() -> sets.save(ProductImageSet.builder().ean(ean).build()));

        String originalKey = PhotoStoreConfig.ORIGINALS_FOLDER + "/" + ean + "/" + UUID.randomUUID() + ".jpg";
        originals.put(originalKey, photo.bytes(), photo.contentType());

        ProductImage image = images.save(ProductImage.builder()
                .ean(ean)
                .source(admin ? ImageSource.ADMIN : ImageSource.USER)
                .status(admin ? ImageStatus.VERIFIED : ImageStatus.PENDING)
                .originalKey(originalKey)
                .originalWidth(photo.width())
                .originalHeight(photo.height())
                .contributorId(userId)
                .contentSha256(ProductImageRenderer.sha256(photo.bytes()))
                .build());
        rendering.render(image);

        if (admin) {
            set.setMainImageId(image.getId());
            set.setPinned(true);
            set.setReviewedAt(Timestamps.nowUtc());
            set.setReviewedById(userId);
        } else {
            for (ProductImage other : images.findByEanAndStatusAndContributorIdNot(ean, ImageStatus.PENDING, userId)) {
                other.setStatus(ImageStatus.VERIFIED);
                other.setConfirmedById(userId);
            }
            set.setNeedsReview(true);
            if (!mainIsShown(set)) {
                MainPicker.pick(images.findByEanOrderByCreatedAtAsc(ean)).ifPresent(best -> set.setMainImageId(best.getId()));
            }
        }
        sets.save(set);

        return views.publicView(ean, set.getMainImageId(), images.findByEanOrderByCreatedAtAsc(ean));
    }

    /** One report per user and photo; repeating it is not an error. */
    @Transactional
    public void report(UUID userId, UUID imageId) {
        userService.lockActive(userId);
        ProductImage image = images.findById(imageId)
                .filter(i -> i.getStatus() != ImageStatus.HIDDEN && i.getStatus() != ImageStatus.CANDIDATE)
                .orElseThrow(() -> new NotFoundException("error.productImage.notFound"));
        if (reports.existsByImageIdAndUserId(imageId, userId)) return;

        reports.save(new ProductImageReport(imageId, userId));
        image.setReportCount(image.getReportCount() + 1);
        image.setFlaggedAt(Timestamps.nowUtc());
        images.save(image);

        sets.findById(image.getEan()).ifPresent(set -> {
            set.setNeedsReview(true);
            sets.save(set);
        });
    }

    private boolean mainIsShown(ProductImageSet set) {
        if (set.getMainImageId() == null) return false;
        return images.findById(set.getMainImageId())
                .map(main -> MainPicker.isShown(main, set.getMainImageId()))
                .orElse(false);
    }

    private void requireStorage() {
        if (!store.enabled() || !originals.enabled()) {
            throw new ServiceUnavailableException("error.productImage.unavailable");
        }
    }

    private static byte[] bytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("error.cardPhoto.unreadable");
        }
    }
}
