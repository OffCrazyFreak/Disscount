package disscount.productImage.service;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import disscount.exceptions.BadRequestException;
import disscount.exceptions.NotFoundException;
import disscount.productImage.catalog.CatalogImportService;
import disscount.productImage.dao.ProductImageImportRunRepository;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.domain.HiddenReason;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageImportRun;
import disscount.productImage.off.OffImageGoneException;
import disscount.productImage.off.OffImageUnavailableException;
import disscount.storage.PhotoStore;
import disscount.storage.PhotoStoreConfig;
import disscount.util.Timestamps;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ProductImageJobs {

    private static final Logger log = LoggerFactory.getLogger(ProductImageJobs.class);
    static final String WEEKLY_IMPORT = "weekly-import";
    static final String PHOTO_SEED = "photo-seed";
    static final Duration IMPORT_EVERY = Duration.ofDays(7);
    static final int RENDER_BATCH = 10;
    static final Duration RENDER_RETRY_AFTER = Duration.ofHours(1);
    static final int MAX_RENDER_ATTEMPTS = 5;

    private final boolean enabled;
    @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS)
    private final PhotoStore store;
    private final CatalogImportService catalog;
    private final OffSeedService seed;
    private final ProductImageRendering rendering;
    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    private final ProductImageImportRunRepository runs;
    private final AtomicBoolean importing = new AtomicBoolean();
    private final AtomicBoolean renderingNow = new AtomicBoolean();

    public ProductImageJobs(@Value("${product-images.jobs.enabled:true}") boolean enabled,
                            @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS) PhotoStore store, CatalogImportService catalog, OffSeedService seed,
                            ProductImageRendering rendering, ProductImageRepository images,
                            ProductImageSetRepository sets, ProductImageImportRunRepository runs) {
        this.enabled = enabled;
        this.store = store;
        this.catalog = catalog;
        this.seed = seed;
        this.rendering = rendering;
        this.images = images;
        this.sets = sets;
        this.runs = runs;
    }

    /**
     * Checked every few hours but runs weekly; the last run is stored so restarts do not repeat it.
     * The catalogue also feeds the product sitemap, so it runs without the photo store; only the photo seed needs it.
     */
    @Scheduled(fixedDelay = 6 * 3_600_000L, initialDelay = 10 * 60_000L)
    public void weeklyImport() {
        if (!enabled || !importing.compareAndSet(false, true)) return;
        try {
            boolean imported = false;
            try {
                if (isDue(WEEKLY_IMPORT)) {
                    catalog.importLatest();
                    runs.save(new ProductImageImportRun(WEEKLY_IMPORT, Timestamps.nowUtc()));
                    imported = true;
                }
            } catch (IOException | RuntimeException e) {
                // A failed import leaves the previous catalogue in place, so the seed below can still use it.
                log.error("Catalogue import failed; it is retried at the next check", e);
            }
            // An interrupt during the download can surface as an IOException, so it is checked again here.
            if (Thread.currentThread().isInterrupted()) return;
            // Tracked apart, so turning the photo store on mid-week seeds at the next check instead of up to a
            // week later; a fresh import seeds its new EANs straight away.
            if (store.enabled() && (imported || isDue(PHOTO_SEED))) {
                seed.seed();
                runs.save(new ProductImageImportRun(PHOTO_SEED, Timestamps.nowUtc()));
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("Open Food Facts photo seed failed; it is retried at the next check", e);
        } finally {
            importing.set(false);
        }
    }

    private boolean isDue(String kind) {
        LocalDateTime last = runs.findById(kind).map(ProductImageImportRun::getFinishedAt).orElse(null);
        return last == null || !last.isAfter(Timestamps.nowUtc().minus(IMPORT_EVERY));
    }

    /** Copies main photos into our photo store one at a time, as Open Food Facts asks of image downloads. */
    @Scheduled(fixedDelay = 15_000L, initialDelay = 2 * 60_000L)
    public void renderMainPhotos() {
        if (!enabled || !store.enabled() || !renderingNow.compareAndSet(false, true)) return;
        try {
            List<ProductImage> batch = images.findUnrenderedMains(ImageStatus.CANDIDATE, Timestamps.nowUtc(),
                    PageRequest.of(0, RENDER_BATCH));
            for (ProductImage image : batch) {
                try {
                    rendering.renderCandidate(image);
                } catch (BadRequestException | OffImageGoneException | IllegalArgumentException e) {
                    // IllegalArgumentException: a stored key that cannot form a valid image URL.
                    skip(image, e);
                } catch (OffImageUnavailableException e) {
                    if (!e.concernsThisImageOnly()) {
                        log.warn("Product photo rendering paused: {}", e.getMessage());
                        return;
                    }
                    // A 403 or 500 for one file says nothing about the next one, so only this photo waits.
                    postpone(image, e);
                } catch (RuntimeException e) {
                    // Network or disk trouble: stop here and try the same photos at the next tick.
                    log.warn("Product photo rendering paused: {}", e.getMessage());
                    return;
                }
            }
            if (batch.isEmpty()) rerenderOlderPhotos();
        } finally {
            renderingNow.set(false);
        }
    }

    /**
     * Brings photos rendered before WebP and the list file up to date, only while no new photo waits, and at the
     * same one-at-a-time pace, because the Open Food Facts ones are downloaded again.
     */
    private void rerenderOlderPhotos() {
        List<ProductImage> older = images.findRenderedWithoutSmallFile(List.of(ImageStatus.VERIFIED, ImageStatus.PENDING),
                MAX_RENDER_ATTEMPTS, Timestamps.nowUtc(), PageRequest.of(0, RENDER_BATCH));
        for (ProductImage image : older) {
            try {
                rendering.rerender(image);
            } catch (OffImageUnavailableException e) {
                if (!e.concernsThisImageOnly()) {
                    log.warn("Re-rendering older product photos paused: {}", e.getMessage());
                    return;
                }
                retryOlderLater(image, e);
            } catch (BadRequestException | OffImageGoneException | IllegalArgumentException | NotFoundException e) {
                retryOlderLater(image, e);
            } catch (RuntimeException e) {
                log.warn("Re-rendering older product photos paused: {}", e.getMessage());
                return;
            }
        }
    }

    /** The photo keeps showing its earlier files; after the last attempt it simply keeps them. */
    private void retryOlderLater(ProductImage loaded, RuntimeException cause) {
        images.findById(loaded.getId()).ifPresent(image -> {
            int attempts = countFailedAttempt(image);
            image.setRenderRetryAt(Timestamps.nowUtc().plus(RENDER_RETRY_AFTER));
            images.save(image);
            log.warn("Could not re-render product photo {} for {} (attempt {}): {}", image.getId(), image.getEan(),
                    attempts, cause.getMessage());
        });
    }

    private void postpone(ProductImage loaded, RuntimeException cause) {
        ProductImage image = current(loaded);
        if (image == null) return;
        int attempts = countFailedAttempt(image);
        if (attempts >= MAX_RENDER_ATTEMPTS) {
            // A photo that keeps failing would hold the main slot forever, so the next photo or a user upload takes it.
            hide(image, cause);
            return;
        }
        log.warn("Retrying product photo {} for {} later: {}", image.getId(), image.getEan(), cause.getMessage());
        image.setRenderRetryAt(Timestamps.nowUtc().plus(RENDER_RETRY_AFTER));
        images.save(image);
    }

    private static int countFailedAttempt(ProductImage image) {
        int attempts = (image.getRenderAttempts() == null ? 0 : image.getRenderAttempts()) + 1;
        image.setRenderAttempts(attempts);
        return attempts;
    }

    /** A photo that cannot be read (a CMYK JPEG, a dead link) would otherwise block the head of the queue forever. */
    private void skip(ProductImage loaded, RuntimeException cause) {
        ProductImage image = current(loaded);
        if (image != null) hide(image, cause);
    }

    /** The row as it is after the download, or null once an admin or the import changed it, so their change stands. */
    private ProductImage current(ProductImage loaded) {
        return images.findById(loaded.getId())
                .filter(i -> ProductImageRendering.stillWaiting(i, loaded))
                .orElse(null);
    }

    private void hide(ProductImage image, RuntimeException cause) {
        log.warn("Skipping product photo {} for {}: {}", image.getId(), image.getEan(), cause.getMessage());
        image.setStatus(ImageStatus.HIDDEN);
        image.setHiddenReason(HiddenReason.JOB_SKIPPED);
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
