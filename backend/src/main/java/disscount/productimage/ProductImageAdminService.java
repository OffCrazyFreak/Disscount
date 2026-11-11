package disscount.productimage;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import disscount.productimage.ProductImageDtos.AdminProductDto;
import disscount.productimage.ProductImageDtos.AdminQueueItemDto;
import disscount.productimage.ProductImageDtos.AdminQueuePageDto;
import disscount.productimage.ProductImageDtos.ContributorPhotoCountDto;
import disscount.productimage.ProductImageDtos.CropDto;
import disscount.productimage.jobs.OffCandidateWriter;
import disscount.productimage.openfoodfacts.OffProductPhotos;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.productimage.render.ProductImageRenderer;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.BadRequestException;
import disscount.shared.NotFoundException;
import disscount.shared.PageDto;
import disscount.shared.Paging;
import disscount.shared.PhotoStore;
import disscount.shared.PhotoStoreConfig;
import disscount.shared.ServiceUnavailableException;
import disscount.shared.StoredPhoto;
import disscount.shared.Timestamps;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ProductImageAdminService {

    public enum QueueFilter { TODO, PENDING, REPORTED }

    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    private final ProductImageReportRepository reports;
    private final ProductImageRendering rendering;
    private final ProductImageViews views;
    private final OpenFoodFactsClient off;
    private final OffCandidateWriter candidates;
    private final ProductImageRemoval removal;
    @Qualifier(PhotoStoreConfig.PRODUCT_ORIGINALS)
    private final PhotoStore originals;

    public AdminQueuePageDto queue(String filter, Pageable requested) {
        Pageable request = Paging.withoutClientSort(requested);
        Page<ProductImageSet> result = switch (parseFilter(filter)) {
            case TODO -> sets.findToReview(request);
            case PENDING -> sets.findWithPending(ImageStatus.PENDING, request);
            case REPORTED -> sets.findWithReports(ImageStatus.HIDDEN, request);
        };

        List<String> eans = result.getContent().stream().map(ProductImageSet::getEan).toList();
        Map<String, List<ProductImage>> byEan = eans.isEmpty()
                ? Map.of()
                : images.findByEanIn(eans).stream().collect(Collectors.groupingBy(ProductImage::getEan));

        Page<AdminQueueItemDto> items = result.map(set -> queueItem(set, byEan.getOrDefault(set.getEan(), List.of())));
        return AdminQueuePageDto.from(PageDto.from(items), sets.countReviewed());
    }

    public AdminProductDto product(String ean) {
        ProductImageQueryService.requireEan(ean);
        ProductImageSet set = sets.findById(ean).orElseGet(() -> ProductImageSet.builder().ean(ean).build());
        return views.adminView(set, images.findByEanOrderByCreatedAtAsc(ean));
    }

    @Transactional
    public AdminProductDto refreshFromOpenFoodFacts(String ean) {
        ProductImageQueryService.requireEan(ean);
        ProductImageSet set = loadOrCreate(ean);

        Optional<OffProductPhotos> photos = off.fetchPhotos(ean);
        photos.ifPresent(found -> {
            found.fronts().forEach(p -> candidates.upsert(ean, p.externalKey(), p.rev(), p.lang()));
            found.raws().forEach(p -> candidates.upsert(ean, p.externalKey(), p.rev(), p.lang()));
        });
        set.setOffDetailsFetchedAt(Timestamps.nowUtc());

        if (!set.isPinned()) {
            MainPicker.pick(images.findByEanOrderByCreatedAtAsc(ean)).ifPresent(best -> set.setMainImageId(best.getId()));
        }
        sets.save(set);
        return product(ean);
    }

    @Transactional
    public AdminProductDto setMain(UUID adminId, String ean, UUID imageId) {
        ProductImage image = imageOf(ean, imageId);
        approve(adminId, image);

        ProductImageSet set = loadOrCreate(ean);
        set.setMainImageId(image.getId());
        set.setPinned(true);
        markReviewed(set, adminId);
        return product(ean);
    }

    @Transactional
    public AdminProductDto setStatus(UUID adminId, UUID imageId, String status) {
        ProductImage image = live(imageId);
        ProductImageSet set = loadOrCreate(image.getEan());

        switch (status) {
            case "VERIFIED" -> approve(adminId, image);
            case "HIDDEN" -> {
                image.setStatus(ImageStatus.HIDDEN);
                image.setHiddenReason(HiddenReason.ADMIN);
                images.save(image);
                releaseMain(set, image);
            }
            default -> throw new BadRequestException("error.productImage.invalidStatus");
        }
        sets.save(set);
        return product(image.getEan());
    }

    /** Deletes the photo's files for good; the row stays so the same file or Open Food Facts photo cannot return. */
    @Transactional
    public AdminProductDto delete(UUID adminId, UUID imageId) {
        ProductImage image = live(imageId);
        ProductImageSet set = loadOrCreate(image.getEan());
        removal.delete(adminId, image);
        if (image.getId().equals(set.getMainImageId())) set.setNeedsReview(true);
        releaseMain(set, image);
        sets.save(set);
        return product(image.getEan());
    }

    public List<ContributorPhotoCountDto> contributorCounts() {
        return images.countByContributor().stream()
                .map(c -> new ContributorPhotoCountDto(c.getUserId(), c.getUploaded(), c.getDeleted()))
                .toList();
    }

    @Transactional
    public AdminProductDto crop(UUID adminId, UUID imageId, int rotation, CropDto crop) {
        ProductImage image = live(imageId);
        image.setRotation(ProductImageRenderer.normalizeRotation(rotation));
        image.setCropX(crop == null ? null : crop.x());
        image.setCropY(crop == null ? null : crop.y());
        image.setCropWidth(crop == null ? null : crop.width());
        image.setCropHeight(crop == null ? null : crop.height());
        if (image.getStatus() == ImageStatus.PENDING) {
            image.setConfirmedById(adminId);
            image.setStatus(ImageStatus.VERIFIED);
        }
        rendering.render(image);
        return product(image.getEan());
    }

    @Transactional
    public AdminProductDto reviewed(UUID adminId, String ean) {
        ProductImageQueryService.requireEan(ean);
        markReviewed(loadOrCreate(ean), adminId);
        return product(ean);
    }

    /** The private upload behind a user or admin photo, for the crop screen; Open Food Facts serves its own. */
    public StoredPhoto original(UUID imageId) {
        ProductImage image = images.findById(imageId)
                .filter(i -> i.getSource() != ImageSource.OPEN_FOOD_FACTS && i.getOriginalKey() != null && !i.isDeleted())
                .orElseThrow(ProductImageAdminService::notFound);
        if (!originals.enabled()) throw new ServiceUnavailableException("error.productImage.unavailable");
        return originals.get(image.getOriginalKey()).orElseThrow(ProductImageAdminService::notFound);
    }

    private void approve(UUID adminId, ProductImage image) {
        if (image.getStatus() == ImageStatus.PENDING) image.setConfirmedById(adminId);
        if (image.getStatus() != ImageStatus.CANDIDATE) image.setStatus(ImageStatus.VERIFIED);
        image.setHiddenReason(null);
        image.setReportCount(0);
        image.setFlaggedAt(null);
        reports.deleteByImageId(image.getId());

        // Rendering moves a candidate to VERIFIED once its copy is in our photo store.
        if (!image.isRendered()) {
            rendering.render(image);
        } else {
            images.save(image);
        }
    }

    private void releaseMain(ProductImageSet set, ProductImage image) {
        if (!image.getId().equals(set.getMainImageId())) return;
        // The admin rejected the shown photo, so the automatic pick takes over again.
        set.setPinned(false);
        set.setMainImageId(MainPicker.pick(images.findByEanOrderByCreatedAtAsc(image.getEan()))
                .map(ProductImage::getId).orElse(null));
    }

    private void markReviewed(ProductImageSet set, UUID adminId) {
        set.setReviewedAt(Timestamps.nowUtc());
        set.setReviewedById(adminId);
        set.setNeedsReview(false);
        sets.save(set);
    }

    private AdminQueueItemDto queueItem(ProductImageSet set, List<ProductImage> all) {
        String preview = all.stream()
                .filter(i -> i.getId().equals(set.getMainImageId()))
                .findFirst()
                .map(views::previewUrl)
                .orElse(null);
        int pending = (int) all.stream().filter(i -> i.getStatus() == ImageStatus.PENDING).count();
        int reported = (int) all.stream()
                .filter(i -> i.getReportCount() > 0 && i.getStatus() != ImageStatus.HIDDEN).count();
        return new AdminQueueItemDto(set.getEan(), set.getName(), set.getBrand(), set.getStoreListings(),
                set.getChainCount(), preview, pending, reported, set.getReviewedAt());
    }

    private ProductImage imageOf(String ean, UUID imageId) {
        return images.findById(imageId)
                .filter(i -> i.getEan().equals(ean) && !i.isDeleted())
                .orElseThrow(ProductImageAdminService::notFound);
    }

    /** A deleted photo has no files left, so nothing but its tombstone may change. */
    private ProductImage live(UUID imageId) {
        return images.findById(imageId).filter(i -> !i.isDeleted()).orElseThrow(ProductImageAdminService::notFound);
    }

    private ProductImageSet loadOrCreate(String ean) {
        return sets.findById(ean).orElseGet(() -> sets.save(ProductImageSet.builder().ean(ean).build()));
    }

    private static QueueFilter parseFilter(String filter) {
        try {
            return QueueFilter.valueOf(filter == null ? "TODO" : filter.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("error.productImage.invalidFilter");
        }
    }

    private static NotFoundException notFound() {
        return new NotFoundException("error.productImage.notFound");
    }
}
