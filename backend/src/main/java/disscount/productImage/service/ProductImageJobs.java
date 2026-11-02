package disscount.productImage.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import disscount.exceptions.BadRequestException;
import disscount.productImage.off.OffImageGoneException;
import disscount.productImage.dao.ProductImageImportRunRepository;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.catalog.CatalogImportService;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageImportRun;
import disscount.productImage.storage.ProductImageStore;
import disscount.util.Timestamps;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ProductImageJobs {

    private static final Logger log = LoggerFactory.getLogger(ProductImageJobs.class);
    static final String WEEKLY_IMPORT = "weekly-import";
    static final Duration IMPORT_EVERY = Duration.ofDays(7);
    static final int RENDER_BATCH = 10;

    private final boolean enabled;
    private final ProductImageStore store;
    private final CatalogImportService catalog;
    private final OffSeedService seed;
    private final ProductImageRendering rendering;
    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    private final ProductImageImportRunRepository runs;
    private final ProductPhotoUploadLimiter limiter;
    private final AtomicBoolean importing = new AtomicBoolean();
    private final AtomicBoolean renderingNow = new AtomicBoolean();

    public ProductImageJobs(@Value("${product-images.jobs.enabled:true}") boolean enabled,
                            ProductImageStore store, CatalogImportService catalog, OffSeedService seed,
                            ProductImageRendering rendering, ProductImageRepository images,
                            ProductImageSetRepository sets, ProductImageImportRunRepository runs,
                            ProductPhotoUploadLimiter limiter) {
        this.enabled = enabled;
        this.store = store;
        this.catalog = catalog;
        this.seed = seed;
        this.rendering = rendering;
        this.images = images;
        this.sets = sets;
        this.runs = runs;
        this.limiter = limiter;
    }

    /** Checked every few hours but runs weekly; the last run is stored so restarts do not repeat it. */
    @Scheduled(fixedDelay = 6 * 3_600_000L, initialDelay = 10 * 60_000L)
    public void weeklyImport() {
        if (!enabled || !store.enabled() || !importing.compareAndSet(false, true)) return;
        try {
            LocalDateTime last = runs.findById(WEEKLY_IMPORT).map(ProductImageImportRun::getFinishedAt).orElse(null);
            if (last != null && last.isAfter(Timestamps.nowUtc().minus(IMPORT_EVERY))) return;

            catalog.importLatest();
            seed.seed();
            runs.save(new ProductImageImportRun(WEEKLY_IMPORT, Timestamps.nowUtc()));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("Product image import failed; it is retried at the next check", e);
        } finally {
            importing.set(false);
        }
    }

    /** Copies main photos into our bucket one at a time, as Open Food Facts asks of image downloads. */
    @Scheduled(fixedDelay = 15_000L, initialDelay = 2 * 60_000L)
    public void renderMainPhotos() {
        if (!enabled || !store.enabled() || !renderingNow.compareAndSet(false, true)) return;
        try {
            List<ProductImage> batch = images.findUnrenderedMains(ImageStatus.CANDIDATE, PageRequest.of(0, RENDER_BATCH));
            for (ProductImage image : batch) {
                try {
                    rendering.render(image);
                } catch (BadRequestException | OffImageGoneException | IllegalArgumentException e) {
                    // IllegalArgumentException: a stored key that cannot form a valid image URL.
                    skip(image, e);
                } catch (RuntimeException e) {
                    // Network or bucket trouble: stop here and try the same photos at the next tick.
                    log.warn("Product photo rendering paused: {}", e.getMessage());
                    return;
                }
            }
        } finally {
            renderingNow.set(false);
        }
    }

    @Scheduled(fixedDelay = 300_000L)
    public void sweepUploadLimiter() {
        limiter.sweep();
    }

    /** A photo that cannot be read (a CMYK JPEG, a dead link) would otherwise block the head of the queue forever. */
    private void skip(ProductImage image, RuntimeException cause) {
        log.warn("Skipping product photo {} for {}: {}", image.getId(), image.getEan(), cause.getMessage());
        image.setStatus(ImageStatus.HIDDEN);
        images.save(image);
        sets.findById(image.getEan()).ifPresent(set -> {
            if (image.getId().equals(set.getMainImageId())) {
                set.setMainImageId(MainPicker.pick(images.findByEanOrderByCreatedAtAsc(image.getEan()))
                        .map(ProductImage::getId).orElse(null));
                sets.save(set);
            }
        });
    }
}
